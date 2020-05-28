# TF Variables
variable "org_name" {
}

variable "api_token" {
}

variable "base_url" {
  default = "okta.com" #"oktapreview.com" if using non-prod.
}

variable "app_url" {
}

variable "superuser_email" {

}

variable "environment" {
  default = "dev"
}

variable "aws_region" {
  default = "us-east-1"
}

variable "aws_profile" {
}

variable "aws_ssm_prefix" {
  default = "dac"
}
