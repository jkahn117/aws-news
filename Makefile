#######
# https://github.com/aws-samples/aws-serverless-airline-booking/blob/develop/amplify.yml
# inspiration at: https://github.com/aws-samples/aws-serverless-airline-booking/blob/develop/Makefile

AMPLIFY_ENV ?= dev
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

deploy.build: ##=> Setup the layer build environment
		$(info [*] Setup build environment...)
		cd backend/layer && \
				sam deploy \
						--template-file build.template.yaml \
						--stack-name aws-news-build-${AMPLIFY_ENV} \
						--capabilities CAPABILITY_NAMED_IAM CAPABILITY_AUTO_EXPAND \
						--parameter-overrides \
								Stage=${AMPLIFY_ENV}
		aws cloudformation wait stack-create-complete --stack-name aws-news-build-${AMPLIFY_ENV}
		$(MAKE) _deploy.set_codebuild_privileged_mode

_deploy.set_codebuild_privileged_mode: ##=>
		$(info [*] Setting privileged mode on CodeBuild project...)
		$(eval PIPELINE_STACK := $(shell aws cloudformation list-stack-resources --stack-name aws-news-build-${AMPLIFY_ENV} | jq -r '.StackResourceSummaries[] | select(.LogicalResourceId == "PipelineApp").PhysicalResourceId' | grep -Eo '\/(.*)\/' | grep -Eo '[^\/]+'))
		@echo Pipeline stack: ${PIPELINE_STACK}
		$(eval BUILD_PROJECT := $(shell aws cloudformation list-stack-resources --stack-name ${PIPELINE_STACK} | jq -r '.StackResourceSummaries[] | select(.LogicalResourceId == "BuildProject").PhysicalResourceId'))
		@echo Build project: ${BUILD_PROJECT}
		$(eval PACKAGE_BUCKET := $(shell aws cloudformation describe-stacks --stack-name ${PIPELINE_STACK} | jq -r '.Stacks[].Outputs[] | select(.OutputKey == "ArtifactsBucketName").OutputValue'))
		@echo Artifact bucket: ${PACKAGE_BUCKET}
		aws codebuild update-project --name ${BUILD_PROJECT} \
						--environment "{ \"type\": \"LINUX_CONTAINER\", \
							\"image\": \"aws/codebuild/standard:2.0\", \
							\"computeType\": \"BUILD_GENERAL1_SMALL\", \
							\"privilegedMode\": true, \
							\"environmentVariables\": [ { \"name\": \"PACKAGE_BUCKET\", \"value\": \"${PACKAGE_BUCKET}\", \"type\": \"PLAINTEXT\" } ] \
						}"

build.run: ##=> Initiate pipeline
	$(info [*] Starting CodePipeline build of dependency layer...)
	$(eval PIPELINE_STACK := $(shell aws cloudformation list-stack-resources --stack-name aws-news-build-${AMPLIFY_ENV} | jq -r '.StackResourceSummaries[] | select(.LogicalResourceId == "PipelineApp").PhysicalResourceId' | grep -Eo '\/(.*)\/' | grep -Eo '[^\/]+'))
	$(eval PIPELINE_NAME := $(shell aws cloudformation list-stack-resources --stack-name ${PIPELINE_STACK} | jq -r '.StackResourceSummaries[] | select(.LogicalResourceId == "Pipeline").PhysicalResourceId'))
	@echo Build project: ${PIPELINE_NAME}
	aws codepipeline start-pipeline-execution --name ${PIPELINE_NAME}

deploy: ##=> Deploy all services
		$(info [*] Deploying...)
		$(MAKE) deploy.content

init: ##=> Initialize environment
		$(info [*] Initialize environment...)
		aws appsync list-data-sources --api-id ${APPSYNC_API_ID} > datasources.json

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

delete: ##=> Delete all
		$(info [*] Deleting...)
		$(MAKE) delete.content

delete.content: ##=> Delete content loading services
		aws cloudformation delete-stack --stack-name $${STACK_NAME}-content-$${AWS_BRANCH}

#### HELPERS ####
_install_dev_packages:
	$(info [*] Installing jq...)
	yum install jq -y
	$(info [*] Upgrading Python SAM CLI and CloudFormation linter to latest...)
	python3 -m pip install --upgrade --user cfn-lint aws-sam-cli

define HELP_MESSAGE

	AWS News Makefile

endef