## dac Okta Org configuration for:
#    Oauth2 SPA
#    Custom authorization server for SPA

# Setup Okta Tenant
provider "okta" {
  org_name  = var.org_name
  api_token = var.api_token
  base_url  = var.base_url
}

# Local variables
locals {
  app_name      = "okta-dac"
  byob_app_name = "okta-byob-dashboard"
}

variable "sleep" {
  default = 6
}

# dac Users - Everyone
data "okta_group" "dac-users" {
  name = "Everyone"
}

data "okta_user" "dac-superuser" {
  search {
    name  = "profile.login"
    value = var.superuser_login
  }
}

resource "okta_group" "dac-superusers" {
  name = "SUPERUSERS"
}
resource "okta_group_memberships" "dac-superusers" {
  group_id = okta_group.dac-superusers.id
  users = [
    data.okta_user.dac-superuser.id
  ]
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
  post_logout_redirect_uris  = [var.app_url]
  grant_types                = ["authorization_code"]
  response_types             = ["code"]
  token_endpoint_auth_method = "none"
  issuer_mode                = "ORG_URL"
  consent_method             = "TRUSTED"
}
# Create BYOB Dashboard SPA App
resource "okta_app_oauth" "okta-byob-dashboard" {
  label                      = local.byob_app_name
  type                       = "browser"
  redirect_uris              = ["${var.byob_app_url}/oauth/callback"]
  post_logout_redirect_uris  = [var.byob_app_url]
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
# Create the BYOB Dashboard App Assignment
resource "okta_app_group_assignment" "okta-byob-dashboard" {
  app_id   = okta_app_oauth.okta-byob-dashboard.id
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

# Deprecate. email template is not supported by Provider oktadeveloper/okta
# Change the welcome email template
// resource "okta_template_email" "email-welcome" {
//   type = "email.welcome"

//   translations {
//     language = "en"
//     subject  = "Welcome to DAC"
//     template = "<div style=\"background-color:#fafafa;margin:0\"> \n  <table style=\"font-family:'proxima nova' , 'century gothic' , 'arial' , 'verdana' , sans-serif;font-size:14px;color:#5e5e5e;width:98%;max-width:600px;float:none;margin:0 auto\" border=\"0\" cellpadding=\"0\" cellspacing=\"0\" valign=\"top\" align=\"left\">\n    <tbody>\n      <tr bgcolor=\"#ffffff\">\n        <td> \n          <table bgcolor=\"#ffffff\" style=\"width:100%;line-height:20px;padding:32px;border:1px solid;border-color:#f0f0f0\" cellpadding=\"0\">\n            <tbody>\n              <tr>\n                <td style=\"padding-top:24px;vertical-align:bottom\"> Hi $${f:escapeHtml(user.firstName)}, </td>\n              </tr>\n              <tr>\n                <td style=\"padding-top:24px\"> <strong>Welcome to DAC</strong> <br/> Click the following link to activate your account:</strong> </td>\n              </tr>\n              <tr>\n                <td align=\"center\" style=\"border:none;padding:25px 0 0 0\"> \n                  <table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" valign=\"top\">\n                    <tbody>\n                      <tr>\n                        <td align=\"center\" style=\"display:inline-block;padding:10px;border:1px solid;text-align:center;cursor:pointer;color:#fff;border-radius:3px;background-color:#44bc98;border-color:#328c71 #328c71 #2f856b;box-shadow:#d8d8d8 0 1px 0\"> <a id=\"reset-password-link\" href=\"http://localhost:8080/activate/$${activationToken}\" style=\"text-decoration:none\"> <span style=\"font-size:13.5px;color:#fff\"> Activate Account </span> </a> </td>\n                      </tr>\n                      <tr>\n                        <td align=\"center\" style=\"color:#999\"> This link expires in $${f:formatTimeDiffHoursNowInUserLocale(org.activationTokenExpirationHours)}. </td>\n                      </tr>\n                    </tbody>\n                  </table> </td>\n              </tr>\n              <tr>\n                <td style=\"padding-top:24px\"> Your username is <strong>$${user.login}</strong></td>\n              </tr>\n            </tbody>\n          </table> </td>\n      </tr>\n      <tr>\n        <td style=\"font-size:12px;padding:16px 0 30px 50px;color:#999\"> This is an automatically generated message from <a href=\"http://www.okta.com\" style=\"color:rgb( 97 , 97 , 97 )\">Okta</a>. Replies are not monitored or answered. </td>\n      </tr>\n    </tbody>\n  </table> \n</div>"
//   }
// }

# insert a delay
resource "null_resource" "waitForPolicy" {
  provisioner "local-exec" {
    command = "sleep ${var.sleep}"
  }
  triggers = {
    "before" = okta_auth_server_policy.okta-dac.id
  }
}

# Create policy rule in custom authorization server
resource "okta_auth_server_policy_rule" "okta-dac" {
  depends_on                    = [null_resource.waitForPolicy]
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
  depends_on                    = [null_resource.waitForPolicy]
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

# A dummy app so that we can grab the Okta cert for TEMPLATE_CERT env variable
resource okta_app_saml dac-dummy-saml {
  label                    = "dac-dummy-saml"
  sso_url                  = "http://example.com"
  recipient                = "http://example.com"
  destination              = "http://example.com"
  audience                 = "http://example.com/audience"
  subject_name_id_template = "$${user.userName}"
  subject_name_id_format   = "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress"
  response_signed          = true
  signature_algorithm      = "RSA_SHA256"
  digest_algorithm         = "SHA256"
  honor_force_authn        = false
  authn_context_class_ref  = "urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport"
}
