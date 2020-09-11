terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
    }
    null = {
      source = "hashicorp/null"
    }
    okta = {
      source = "oktadeveloper/okta"
    }
  }
  required_version = ">= 0.13"
}
