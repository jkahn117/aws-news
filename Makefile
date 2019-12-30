#######
# https://github.com/aws-samples/aws-serverless-airline-booking/blob/develop/amplify.yml
# inspiration at: https://github.com/aws-samples/aws-serverless-airline-booking/blob/develop/Makefile

#
AMPLIFY_ENV ?= dev
STACK_NAME := $(shell jq -r '.providers.awscloudformation.StackName' ./amplify/\#current-cloud-backend/amplify-meta.json)
DEPLOYMENT_BUCKET_NAME := $(shell jq -r '.providers.awscloudformation.DeploymentBucketName' ./amplify/\#current-cloud-backend/amplify-meta.json)
AWS_REGION := $(shell jq -r '.providers.awscloudformation.Region' ./amplify/\#current-cloud-backend/amplify-meta.json)
# Amplify generated resources
APPSYNC_API_ID := $(shell jq -r '.api[(.api | keys)[0]].output.GraphQLAPIIdOutput' ./amplify/\#current-cloud-backend/amplify-meta.json)
BLOGS_TABLE_NAME := $(shell jq -r '.dataSources[] | select(.name == "BlogTable") | .dynamodbConfig.tableName' datasources.json)
ARTICLES_TABLE_NAME := $(shell jq -r '.dataSources[] | select(.name == "ArticleTable") | .dynamodbConfig.tableName' datasources.json)
CONTENT_BUCKET := $(shell jq -r '.storage[(.storage | keys)[0]].output.BucketName' ./amplify/\#current-cloud-backend/amplify-meta.json)

target:
		$(info ${HELP_MESSAGE})
		@exit 0

init: ##=> Initialize environment
		$(info [*] Initialize environment...)
		aws appsync list-data-sources --api-id ${APPSYNC_API_ID} > datasources.json

deploy: ##=> Deploy all services
		$(info [*] Deploying...)
		$(MAKE) deploy.layer
		$(MAKE) deploy.content

deploy.content: ##=> Deploy content loading services
		$(info [*] Deploying content services...)
		cd backend/content && \
				sam package \
						--s3-bucket ${DEPLOYMENT_BUCKET_NAME} \
						--output-template-file packaged.yaml && \
				sam deploy \
						--template-file packaged.yaml \
						--stack-name ${STACK_NAME}-content-${AMPLIFY_ENV} \
						--capabilities CAPABILITY_IAM \
						--parameter-overrides \
								Stage=${AMPLIFY_ENV} \
								BlogsTable=${BLOGS_TABLE_NAME} \
								ArticlesTable=${ARTICLES_TABLE_NAME} \
								ContentBucket=${CONTENT_BUCKET} \
								LayerArn=/news/${AMPLIFY_ENV}/backend/loader/layer


deploy.layer: ##=> Deploy support layer for loader service
		$(info [*] Packaging, building, and deploying loader dependency layer, this can take a few minutes...)
		cd backend/layer && \
				rm dependencies.zip && \
				docker run --rm \
								-v `pwd`/dependencies:`pwd` \
								-w `pwd` \
								lambci/lambda:build-ruby2.5 \
								./build.sh && \
				mv dependencies/dependencies.zip . && \
				sam package \
						--s3-bucket ${DEPLOYMENT_BUCKET_NAME} \
						--output-template-file packaged.yaml && \
				sam deploy \
						--template-file packaged.yaml \
						--stack-name ${STACK_NAME}-dependencies-${AMPLIFY_ENV} \
						--capabilities CAPABILITY_IAM

delete: ##=> Delete all
		$(info [*] Deleting...)
		$(MAKE) delete.content
		$(MAKE) delete.layer

delete.content: ##=> Delete content loading services
		aws cloudformation delete-stack --stack-name $${STACK_NAME}-content-$${AWS_BRANCH}

delete.layer: ##=> Delete support layer for loader service
		aws cloudformation delete-stack --stack-name $${STACK_NAME}-dependencies-$${AWS_BRANCH}

#### HELPERS ####
_install_dev_packages:
	$(info [*] Installing jq...)
	yum install jq -y
	$(info [*] Upgrading Python SAM CLI and CloudFormation linter to latest...)
	python3 -m pip install --upgrade --user cfn-lint aws-sam-cli

define HELP_MESSAGE

	AWS News Makefile

endef