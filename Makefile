#######
# https://github.com/aws-samples/aws-serverless-airline-booking/blob/develop/amplify.yml
# inspiration at: https://github.com/aws-samples/aws-serverless-airline-booking/blob/develop/Makefile

AMPLIFY_ENV ?= prod
STACK_NAME ?= "UNDEFINED"
DEPLOYMENT_BUCKET_NAME ?= "UNDEFINED"
AWS_REGION ?= "UNDEFINED"
# Amplify generated resources
APPSYNC_API_ID ?= "UNDEFINED"
APPSYNC_ENDPOINT ?= "UNDEFINED"
BLOGS_TABLE_NAME ?= "UNDEFINED"
ARTICLES_TABLE_NAME ?= "UNDEFINED"
CONTENT_BUCKET ?= "UNDEFINED"

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
						--stack-name ${STACK_NAME}-content \
						--capabilities CAPABILITY_IAM \
						--parameter-overrides \
								Stage=${AMPLIFY_ENV} \
								AppSyncApiId=${APPSYNC_API_ID} \
								AppSyncEndpoint=${APPSYNC_ENDPOINT} \
								BlogsTable=${BLOGS_TABLE_NAME} \
								ArticlesTable=${ARTICLES_TABLE_NAME} \
								ContentBucket=${CONTENT_BUCKET} \
								LayerArn=/news/${AMPLIFY_ENV}/backend/loader/layer

deploy.layer: ##=> Deploy support layer for loader service
		$(info [*] Packaging, building, and deploying loader dependency layer, this can take a few minutes...)
		cd backend/layer/dependencies && \
				./build.sh && \
				mv dependencies.zip .. && \
				cd .. && \
				sam package \
						--s3-bucket ${DEPLOYMENT_BUCKET_NAME} \
						--output-template-file packaged.yaml && \
				sam deploy \
						--template-file packaged.yaml \
						--stack-name ${STACK_NAME}-dependencies \
						--capabilities CAPABILITY_IAM \
						--parameter-overrides \
								Stage=${AMPLIFY_ENV}

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
	$(info [*] Installing Ruby 2.5...)
	echo "source ~/.rvm/scripts/rvm" >> ~/.bashrc
	echo "export GEM_PATH=/usr/local/rvm/gems/ruby-2.5.0" >> ~/.bashrc
	cat ~/.bashrc
	source ~/.bashrc
	rvm install 2.5.0 && rvm use 2.5.0 --default
	$(info [*] Installing jq...)
	yum install jq -y
	$(info [*] Upgrading Python SAM CLI and CloudFormation linter to latest...)
	python3 -m pip install --upgrade --user cfn-lint aws-sam-cli

define HELP_MESSAGE

	AWS News Makefile

endef