TARGET ?= aws
TERRAFORM ?= terraform
API_DIR ?= dac-api
SPA_DIR ?= dac-spa

help:
	@echo "Usage:\n\tmake okta\n\tmake api\n\tmake spa"
	@echo "\tmake all

TERRAFORM_VERSION := $(shell terraform --version 2>/dev/null)
SERVERLESS_VERSION := $(shell serverless -v 2>/dev/null)
AWSCLI_VERSION := $(shell aws --version 2>/dev/null)

check:
ifdef TERRAFORM_VERSION
	@echo "Found $(TERRAFORM_VERSION)"
else
	@echo "`terraform` not found. Please see: https://docs.idp.rocks/setup/#install-terraform for details."
endif
ifdef SERVERLESS_VERSION
	@echo "Found Serverless: $(SERVERLESS_VERSION)"
else
	@echo "`serverless` not found. Please see: https://docs.idp.rocks/setup/#install-serverless for details."
endif
ifdef AWSCLI_VERSION
	@echo "Found $(AWSCLI_VERSION)"
else
	@echo "`aws` not found. Please see: https://docs.idp.rocks/setup/#install-aws-cli for details. "
endif

TERRAFORM-exists: ; @which terraform > /dev/null
AWSCLI-exists: ; @which aws > /dev/null
SERVERLESS-exists: ; @which serverless > /dev/null

.DEFAULT_GOAL := all
all: check okta api spa

.PHONY: planOkta
planOkta: 
	@cd ${TERRAFORM} && \
	terraform init && \
	terraform plan -out=okta.setup.tfplan -lock=false

.PHONY: okta
okta: planOkta
	@cd ${TERRAFORM} && \
	terraform apply -auto-approve okta.setup.tfplan && \
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

.PHONY: setupApi
setupApi: 
	@cd ${API_DIR} && \
	npm install

.PHONY: api
api: setupApi
	@cd ${API_DIR} && \
	serverless deploy -v

.PHONY: removeApi
removeApi: 
	@cd ${API_DIR} && \
	serverless remove -v

.PHONY: setupSpa
setupSpa: 
	@cd ${SPA_DIR} && \
	npm install

.PHONY: spa
spa: setupSpa
	@cd ${SPA_DIR} && \
	serverless deploy -v