# This is the aws CLI command that must be run
output "vue_env_local" {
  value = <<EOF
VUE_APP_CLIENT_ID=${okta_app_oauth.okta-dac.client_id}
VUE_APP_ISSUER=https://${var.org_name}.${var.base_url}/oauth2/${okta_auth_server.okta-dac.id}
EOF
}
