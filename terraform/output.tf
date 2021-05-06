# This is the aws CLI command that must be run
output "api_env_json" {
  value = <<EOF
  {
  "AWS_PROFILE": "${var.aws_profile}",
  "AWS_REGION": "${var.aws_region}",
  "ENVIRONMENT": "${var.environment}",
  "AWS_SSM_PREFIX": "${var.aws_ssm_prefix}"
  }
EOF
}

output "vue_env_dev" {
  value = <<EOF
VUE_APP_CLIENT_ID=${okta_app_oauth.okta-dac.client_id}
VUE_APP_ISSUER=https://${var.org_name}.${var.base_url}/oauth2/${okta_auth_server.okta-dac.id}
VUE_APP_ENFORCE_DOMAIN_CHECK=true
VUE_APP_LOGO=
VUE_APP_LOGO_INVERSE=
VUE_APP_COMPANY_NAME=
VUE_APP_PRIMARY_COLOR=
VUE_APP_SECONDARY_COLOR=
EOF
}
