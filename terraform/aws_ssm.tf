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
  value       = "MIIDnjCCAoagAwIBAgIGAVzS5UBOMA0GCSqGSIb3DQEBCwUAMIGPMQswCQYDVQQGEwJVUzETMBEGA1UECAwKQ2FsaWZvcm5pYTEWMBQGA1UEBwwNU2FuIEZyYW5jaXNjbzENMAsGA1UECgwET2t0YTEUMBIGA1UECwwLU1NPUHJvdmlkZXIxEDAOBgNVBAMMB3plZWtob28xHDAaBgkqhkiG9w0BCQEWDWluZm9Ab2t0YS5jb20wHhcNMTcwNjIzMDI1OTU4WhcNMjcwNjIzMDMwMDU4WjCBjzELMAkGA1UEBhMCVVMxEzARBgNVBAgMCkNhbGlmb3JuaWExFjAUBgNVBAcMDVNhbiBGcmFuY2lzY28xDTALBgNVBAoMBE9rdGExFDASBgNVBAsMC1NTT1Byb3ZpZGVyMRAwDgYDVQQDDAd6ZWVraG9vMRwwGgYJKoZIhvcNAQkBFg1pbmZvQG9rdGEuY29tMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAtrAO+BxTPPSJetJEXPQze8THcRLaD8aiTyCfV6NnZ/ERX85NJ6YpOarF82OecQp2LhaP4SnZfFYPS8kaltk0YjSlz206XcDysGaUWPsIbDdljtLMbb1QXht3b+/dA6ynPtk0p1NqLwXTWuhZo+VJ04vEFq0CbQomvhU7zHnIvGIiTjvhAxW2UI25bkW9K8jvyJ7NaNZ+5J5MsTlpdYWvibd2p6UvuTz4XhQW+AajAubBdOcyCfuvl61d7TCd9rT0sot1qrCWB77rCr6DcR2tonJ7FSUaPezCobm/OgWi5NoC/M5lgXhoG+FwC6GqwiJwRpS9pI5dkmUudUDPVoh8bQIDAQABMA0GCSqGSIb3DQEBCwUAA4IBAQA/W5j1euP2nLhSqlrJYwMm/7XXCqnhu3eBLnzkgRqNH6khtX1spAhC3w5L0w0JF4SgfjXAbAsWn6a6YsicEQsrDGdp3deMiKkkS9loWsJRhZB+FYvkrGv/EDtF9p16K2hcDbNAXkV7mKRbWiKthzWJ4o72DyPfwlyq8bTqVDk5ymHBYu2taomgRSQq/E+vGU1XXK9mPBHOq+ZeIDr+g8zvZhsU0R1uH+jM9iniPVX7DirN0NwrsYfl5mDCZTjCiA5sRnHN644s3Kw0GHbvEYsxfjQQm/FtPiVQzg2H8EygVTOnQnyt+5KMEeEz7OTBxmkn+qw/u2YTUuUiUAM7dwt5"

  tags = {
    environment = var.environment
  }
}
