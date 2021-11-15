# TF Variables
variable "org_name" {
  type = string
}

variable "api_token" {
  type = string
}

variable "base_url" {
  default = "okta.com" #"oktapreview.com" if using non-prod.
}

variable "app_url" {
  type    = string
  default = "http://localhost:8080"
}

variable "superuser_login" {
  type = string
}

variable "environment" {
  type    = string
  default = "dev"
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "aws_profile" {
}

variable "aws_ssm_prefix" {
  type    = string
  default = "dac"
}
