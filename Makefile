TARGET ?= aws
TERRAFORM ?= terraform
API_DIR ?= dac-api
SPA_DIR ?= dac-spa

help:
	@echo "Usage:\n\tmake okta\n\tmake api\n\tmake spa"
	@echo "\tmake all

NPM_VERSION := $(shell npm -v 2>/dev/null)
TERRAFORM_VERSION := $(shell terraform --version 2>/dev/null)
SERVERLESS_VERSION := $(shell serverless -v 2>/dev/null)
AWSCLI_VERSION := $(shell aws --version 2>/dev/null)
TFVAR_EXISTS := $(shell test -s ./terraform/terraform.tfvars && echo exists)

.PHONY: check
check:
ifdef TERRAFORM_VERSION
	@echo "Found $(TERRAFORM_VERSION)"
else
	@echo "'terraform' CLI not found. Please see: https://docs.idp.rocks/setup/#install-terraform for details."
endif
ifdef SERVERLESS_VERSION
	@echo "Found Serverless: $(SERVERLESS_VERSION)"
else
	@echo "'serverless' CLI not found. Please see: https://docs.idp.rocks/setup/#install-serverless for details."
endif
ifdef AWSCLI_VERSION
	@echo "Found $(AWSCLI_VERSION)"
else
	@echo "'aws' CLI not found. Please see: https://docs.idp.rocks/setup/#install-aws-cli for details. "
endif
ifdef NPM_VERSION
	@echo "Found npm $(NPM_VERSION)"
else
	@echo "'npm' not found. Please see: https://docs.idp.rocks/setup/#install-npm for details. "
endif
ifdef TFVAR_EXISTS
	@echo "Found terraform.tfvars"
else
	@echo "'terraform.tfvars' not found. Please see https://docs.idp.rocks/setup/#terraform for configuring the file. "
endif

TERRAFORM-exists: ; @which terraform > /dev/null
AWSCLI-exists: ; @which aws > /dev/null
SERVERLESS-exists: ; @which serverless > /dev/null

.DEFAULT_GOAL := all
all: check okta api spa

removeAll: check removeSpa removeApi destroyOkta

.PHONY: planOkta
planOkta: 
	@cd ${TERRAFORM} && \
	terraform init && \
	terraform plan -out=okta.setup.tfplan -lock=false

.PHONY: okta
okta: planOkta
	@cd ${TERRAFORM} && \
	terraform apply -parallelism=1 -auto-approve okta.setup.tfplan && \
	terraform output

.PHONY: destroyOktaPlan
destroyOktaPlan:
	@cd ${TERRAFORM} && \
	terraform init && \
	terraform plan -destroy -out=okta.delete.tfplan

.PHONY: destroyOkta
destroyOkta: destroyOktaPlan
	@cd ${TERRAFORM} && \
	terraform apply -auto-approve okta.delete.tfplan

.PHONY: createEnvJson
createEnvJson: 
	@cd ${TERRAFORM} && \
	terraform output api_env_json | sed -e "s/^<<EOT//" -e "s/EOT$$//" > ../${API_DIR}/.env.json

.PHONY: setupApi
setupApi: createEnvJson
	@cd ${API_DIR} && \
	npm install

.PHONY: api
api: setupApi
	@cd ${API_DIR} && \
	serverless deploy -v

.PHONY: removeApi
removeApi: 
	@cd ${API_DIR} && \
	serverless remove -v && \
	rm -rf node_modules

.PHONY: createEnvLocal
createEnvLocal: 
	@cd ${TERRAFORM} && \
	terraform output vue_env_dev | sed -e "s/^<<EOT//" -e "s/EOT$$//" > ../${SPA_DIR}/.env.development.local

.PHONY: createVueEnv
createVueEnv: createEnvLocal
	@cd ${API_DIR} && \
	printf %s "VUE_APP_API=" >> ../${SPA_DIR}/.env.development.local && \
	serverless info --verbose | grep ServiceEndpoint | grep -o 'http.*' >> ../${SPA_DIR}/.env.development.local

.PHONY: setupSpa
setupSpa: createVueEnv
	@cd ${SPA_DIR} && \
	npm install

.PHONY: spa
spa: setupSpa
	@echo "Run 'npm run serve' to run Single Page App locally. " && \
	echo "\tThen go to http://localhost:8080/ in your browser."

# ========================================================================
# TODO: Make deploy SPA.
# ========================================================================
#   Experimental - for CloudFront, S3, Route53 setup in AWS for the SPA
#	@cd ${SPA_DIR} && \
#	serverless deploy -v

.PHONY: removeSpa
removeSpa: 
	@cd ${SPA_DIR} && \
	serverless remove -v && \
	rm -rf node_modules dist

.PHONY: dacOkta
dacOkta: okta
	@echo "1. Terraform Okta Complete"
	@echo "2. Env variables for API written to AWS Systems Manager"

.PHONY: dacApi
dacApi: dacOkta
	@echo "Now Deploying Serverless..."

.PHONY: all
all: dacApi
	@echo "Make complete."
