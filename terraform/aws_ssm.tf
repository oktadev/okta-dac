provider "aws" {
  region                  = var.aws_region
  shared_credentials_file = "~/.aws/creds"
  profile                 = var.aws_profile
}

resource "aws_ssm_parameter" "okta-api-token" {
  name        = "/${var.aws_ssm_prefix}/okta/${var.environment}/api-token"
  description = "Okta API Token"
  type        = "SecureString"
  value       = var.api_token

  tags = {
    environment = var.environment
  }
}

resource "aws_ssm_parameter" "okta-client-id" {
  name        = "/${var.aws_ssm_prefix}/okta/${var.environment}/client-id"
  description = "Okta App Client ID"
  type        = "String"
  value       = okta_app_oauth.okta-dac.client_id

  tags = {
    environment = var.environment
  }
}

resource "aws_ssm_parameter" "okta-issuer-uri" {
  name        = "/${var.aws_ssm_prefix}/okta/${var.environment}/issuer-uri"
  description = "Okta Issuer URI"
  type        = "String"
  value       = "https://${var.org_name}.${var.base_url}/oauth2/${okta_auth_server.okta-dac.id}"

  tags = {
    environment = var.environment
  }
}

resource "aws_ssm_parameter" "okta-audience" {
  name        = "/${var.aws_ssm_prefix}/okta/${var.environment}/audience"
  description = "Okta Audience"
  type        = "String"
  value       = "api://${local.app_name}"

  tags = {
    environment = var.environment
  }
}

resource "aws_ssm_parameter" "dns-verify-prefix" {
  name        = "/${var.aws_ssm_prefix}/okta/${var.environment}/dns-verify-prefix"
  description = "DNS Verification Prefix"
  type        = "String"
  value       = "_oktadac.verification"

  tags = {
    environment = var.environment
  }
}

resource "aws_ssm_parameter" "dac-prefix" {
  name        = "/${var.aws_ssm_prefix}/okta/${var.environment}/dac-prefix"
  description = "Reserve this Prefix for naming objects in Okta"
  type        = "String"
  value       = "DAC"

  tags = {
    environment = var.environment
  }
}

resource "aws_ssm_parameter" "okta-idp-disco-policyId" {
  name        = "/${var.aws_ssm_prefix}/okta/${var.environment}/okta-idp-disco-policyId"
  description = "The default routing rules' PolicyId"
  type        = "String"
  value       = data.okta_policy.idp_policy.id

  tags = {
    environment = var.environment
  }
}

resource "aws_ssm_parameter" "dummy-cert" {
  name        = "/${var.aws_ssm_prefix}/okta/${var.environment}/dummy-cert"
  description = "A dummy DER or PEM encoded public key cert allowing us to add inactive IdPs"
  type        = "String"
  value       = okta_app_saml.dac-dummy-saml.certificate

  tags = {
    environment = var.environment
  }
}
