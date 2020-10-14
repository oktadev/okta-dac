terraform {
  required_providers {
    null = {
      source = "hashicorp/null"
    }
    aws = {
      source = "hashicorp/aws"
    }
    okta = {
      source  = "oktadeveloper/okta"
      version = "~> 3.0"
    }
  }
  required_version = ">= 0.13"
}
