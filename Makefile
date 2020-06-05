#######
# https://github.com/aws-samples/aws-serverless-airline-booking/blob/develop/amplify.yml
# inspiration at: https://github.com/aws-samples/aws-serverless-airline-booking/blob/develop/Makefile

AMPLIFY_ENV ?= dev
STACK_NAME ?= "UNDEFINED"
DEPLOYMENT_BUCKET_NAME ?= "UNDEFINED"
AWS_REGION ?= "UNDEFINED"

target:
		$(info ${HELP_MESSAGE})
		@exit 0

deploy: ##=> Deploy all services
		$(info [*] Deploying...)
		$(MAKE) init
		# $(MAKE) deploy.support
		$(MAKE) deploy.common
		$(MAKE) deploy.ingestion
		$(MAKE) deploy.analytics
		$(MAKE) deploy.services

init: ##=> Initialize environment
		$(info [*] Initialize environment...)
		aws appsync list-data-sources --api-id ${APPSYNC_API_ID} > datasources.json

deploy.support: ##=> Deploy support package
	$(info [*] Deploying support...)
	cd backend/support && \
		sam build && \
		sam package \
						--s3-bucket ${DEPLOYMENT_BUCKET_NAME} \
						--output-template-file packaged.yaml && \
		sam deploy \
						--template-file packaged.yaml \
						--stack-name ${STACK_NAME}-support \
						--capabilities CAPABILITY_IAM \
						--parameter-overrides \
								Stage=${AMPLIFY_ENV}

deploy.common: ##=> Deploy common resources
	$(info [*] Deploying common resources...)
	cd backend/common && \
		sam package \
						--s3-bucket ${DEPLOYMENT_BUCKET_NAME} \
						--output-template-file packaged.yaml && \
		sam deploy \
						--template-file packaged.yaml \
						--stack-name ${STACK_NAME}-common \
						--capabilities CAPABILITY_IAM \
						--parameter-overrides \
								Stage=${AMPLIFY_ENV}

deploy.ingestion: ##=> Deploy ingestion services
		$(info [*] Deploying ingestion services...)
		cd backend/ingestion && \
				sam build && \
				sam package \
						--s3-bucket ${DEPLOYMENT_BUCKET_NAME} \
						--output-template-file packaged.yaml && \
				sam deploy \
						--template-file packaged.yaml \
						--stack-name ${STACK_NAME}-ingestion \
						--capabilities CAPABILITY_IAM \
						--parameter-overrides \
								Stage=${AMPLIFY_ENV} \
								AppSyncApiId=/news/${AMPLIFY_ENV}/amplify/api/id \
								AppSyncEndpoint=/news/${AMPLIFY_ENV}/amplify/api/endpoint \
								BlogsTable=/news/${AMPLIFY_ENV}/amplify/storage/table/blogs \
								ArticlesTable=/news/${AMPLIFY_ENV}/amplify/storage/table/articles \
								ContentBucket=/news/${AMPLIFY_ENV}/amplify/storage/bucket/content \
								LayerArn=/news/${AMPLIFY_ENV}/backend/support/ingestion/layer

deploy.analytics: ##=> Deploy analytics
	$(info [*] Deploying analytics...)
	cd backend/analytics && \
			sam build && \
			sam package \
					--s3-bucket ${DEPLOYMENT_BUCKET_NAME} \
					--output-template-file packaged.yaml && \
			sam deploy \
					--template-file packaged.yaml \
					--stack-name ${STACK_NAME}-analytics \
					--capabilities CAPABILITY_IAM \
					--parameter-overrides \
							Stage=${AMPLIFY_ENV} \
							PinpointApplicationId=/news/${AMPLIFY_ENV}/amplify/analytics/app/id \
							ElasticacheEndpoint=/news/${AMPLIFY_ENV}/common/elasticache/endpoint \
							ElasticachePort=/news/${AMPLIFY_ENV}/common/elasticache/port \
							ElasticacheAccessSG=/news/${AMPLIFY_ENV}/common/elasticache/sg \
							LambdaSubnet1=/news/${AMPLIFY_ENV}/common/network/privsubnet1 \
							LambdaSubnet2=/news/${AMPLIFY_ENV}/common/network/privsubnet2

deploy.services: ##=> Deploy services used by API
	$(info [*] Deploying API services...)
	cd backend/services && \
			sam build && \
			sam package \
					--s3-bucket ${DEPLOYMENT_BUCKET_NAME} \
					--output-template-file packaged.yaml && \
			sam deploy \
					--template-file packaged.yaml \
					--stack-name ${STACK_NAME}-services \
					--capabilities CAPABILITY_IAM CAPABILITY_AUTO_EXPAND \
					--parameter-overrides \
							Stage=${AMPLIFY_ENV} \
							AppSyncApiId=/news/${AMPLIFY_ENV}/amplify/api/id \
							ArticlesTable=/news/${AMPLIFY_ENV}/amplify/storage/table/articles \
							ElasticacheEndpoint=/news/${AMPLIFY_ENV}/common/elasticache/endpoint \
							ElasticachePort=/news/${AMPLIFY_ENV}/common/elasticache/port \
							ElasticacheAccessSG=/news/${AMPLIFY_ENV}/common/elasticache/sg \
							LambdaSubnet1=/news/${AMPLIFY_ENV}/common/network/privsubnet1 \
							LambdaSubnet2=/news/${AMPLIFY_ENV}/common/network/privsubnet2

delete: ##=> Delete all
		$(info [*] Deleting...)
		$(MAKE) delete.services
		$(MAKE) delete.analytics
		$(MAKE) delete.ingestion
		$(MAKE) delete.common
		$(MAKE) delete.support

delete.services: ##=> Delete services
		aws cloudformation delete-stack --stack-name $${STACK_NAME}-services

delete.analytics: ##=> Delete analytics
		aws cloudformation delete-stack --stack-name $${STACK_NAME}-analytics

delete.ingestion: ##=> Delete ingestion
		aws cloudformation delete-stack --stack-name $${STACK_NAME}-ingestion

delete.common: ##=> Delete common
		aws cloudformation delete-stack --stack-name $${STACK_NAME}-common

delete.support: ##=> Delete support
		aws cloudformation delete-stack --stack-name $${STACK_NAME}-support

export.parameter:
	$(info [+] Adding new parameter named "${NAME}")
	aws ssm put-parameter \
		--name "$${NAME}" \
		--type "String" \
		--value "$${VALUE}" \
		--overwrite

#### HELPERS ####
_install_dev_packages:
	$(info [*] Installing jq...)
	yum install jq -y
	$(info [*] Upgrading Python SAM CLI and CloudFormation linter to latest...)
	python3 -m pip install --upgrade --user cfn-lint aws-sam-cli

	$(info [*] Update to Ruby 2.7 and set path...)
	rvm install 2.7
	rvm --default use ruby-2.7

	ruby -v

define HELP_MESSAGE

	AWS News Makefile

endef