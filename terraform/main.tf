## dac Okta Org configuration for:
#    Oauth2 SPA
#    Custom authorization server for SPA

# Setup Okta Tenant
provider "okta" {
  org_name  = var.org_name
  api_token = var.api_token
  base_url  = var.base_url
  version   = "~> 3.0"
}

# Local variables
locals {
  app_name = "dac-admin"
}

# dac Users - Everyone 
data "okta_group" "dac-users" {
  name = "Everyone"
}

# dac Users - Everyone 
resource "okta_group" "dac-superusers" {
  name = "SUPERUSERS"
}

resource "okta_group_roles" "dac-superusers" {
  group_id    = okta_group.dac-superusers.id
  admin_roles = ["SUPER_ADMIN"]
}

# Get default IDP Policy
data "okta_policy" "idp_policy" {
  name = "Idp Discovery Policy"
  type = "IDP_DISCOVERY"
}

# Create OAuth2 SPA App
resource "okta_app_oauth" "okta-dac" {
  label                      = local.app_name
  type                       = "browser"
  redirect_uris              = ["${var.app_url}/oauth/callback"]
  post_logout_redirect_uris  = ["${var.app_url}"]
  grant_types                = ["authorization_code"]
  response_types             = ["code"]
  token_endpoint_auth_method = "none"
  issuer_mode                = "ORG_URL"
  consent_method             = "TRUSTED"
}

resource "okta_app_user_schema" "okta-dac-tenants" {
  app_id      = okta_app_oauth.okta-dac.id
  index       = "tenants"
  title       = "Tenants"
  type        = "array"
  array_type  = "string"
  description = "Tenants App Profile Attribute"
  master      = "OKTA"
  scope       = "NONE"
  permissions = "READ_WRITE"
}

# Create the App Assignment
resource "okta_app_group_assignment" "okta-dac" {
  app_id   = okta_app_oauth.okta-dac.id
  group_id = okta_group.dac-superusers.id
}

# Create Trusted Origin for the APP
resource "okta_trusted_origin" "okta-dac" {
  name   = "DAC SPA"
  origin = var.app_url
  scopes = ["CORS", "REDIRECT"]
}

# Create Custom Authorization Server
resource "okta_auth_server" "okta-dac" {
  audiences   = ["api://${local.app_name}"]
  description = "Okta DAC Authorization Server"
  name        = local.app_name
}

## Create scope in custom authorization server
resource "okta_auth_server_scope" "okta-dac" {
  auth_server_id   = okta_auth_server.okta-dac.id
  metadata_publish = "ALL_CLIENTS"
  name             = "dac.admin"
  description      = "Scope for accessing the okta-dac App"
  consent          = "IMPLICIT"
}

# Create policy in custom authorization server
resource "okta_auth_server_policy" "okta-dac" {
  auth_server_id   = okta_auth_server.okta-dac.id
  status           = "ACTIVE"
  name             = "okta-dac"
  description      = "okta-dac policy"
  priority         = 1
  client_whitelist = [okta_app_oauth.okta-dac.client_id]
}

## Create tokens claim in custom authorization server
resource "okta_auth_server_claim" "okta-dac-tenants-at" {
  auth_server_id = okta_auth_server.okta-dac.id
  name           = "tenants"
  value          = "appuser.tenants"
  value_type     = "EXPRESSION"
  scopes         = [okta_auth_server_scope.okta-dac.name]
  claim_type     = "RESOURCE"
}

resource "okta_auth_server_claim" "okta-dac-tenants-id" {
  auth_server_id = okta_auth_server.okta-dac.id
  name           = "tenants"
  value          = "appuser.tenants"
  value_type     = "EXPRESSION"
  claim_type     = "IDENTITY"
  scopes         = [okta_auth_server_scope.okta-dac.name]
}

resource "okta_auth_server_claim" "okta-dac-groups-at" {
  auth_server_id    = okta_auth_server.okta-dac.id
  name              = "groups"
  value             = ".*"
  value_type        = "GROUPS"
  group_filter_type = "REGEX"
  claim_type        = "RESOURCE"
  scopes            = [okta_auth_server_scope.okta-dac.name]
}

resource "okta_auth_server_claim" "okta-dac-groups-id" {
  auth_server_id    = okta_auth_server.okta-dac.id
  name              = "groups"
  value             = ".*"
  value_type        = "GROUPS"
  group_filter_type = "REGEX"
  claim_type        = "IDENTITY"
  scopes            = [okta_auth_server_scope.okta-dac.name]
}

# Create policy rule in custom authorization server
resource "okta_auth_server_policy_rule" "okta-dac" {
  auth_server_id                = okta_auth_server.okta-dac.id
  policy_id                     = okta_auth_server_policy.okta-dac.id
  status                        = "ACTIVE"
  name                          = "DAC Users"
  priority                      = 1
  grant_type_whitelist          = ["authorization_code"]
  scope_whitelist               = ["openid", "profile", "email", "address", "phone", "offline_access"]
  group_whitelist               = [data.okta_group.dac-users.id]
  access_token_lifetime_minutes = 60
}

resource "okta_auth_server_policy_rule" "okta-dac-catch-all" {
  auth_server_id                = okta_auth_server.okta-dac.id
  policy_id                     = okta_auth_server_policy.okta-dac.id
  status                        = "ACTIVE"
  name                          = "Everyone Else"
  priority                      = 2
  grant_type_whitelist          = ["authorization_code"]
  scope_whitelist               = ["*"]
  group_whitelist               = [data.okta_group.dac-users.id]
  access_token_lifetime_minutes = 60
}
