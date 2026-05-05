aws_region = "eu-south-1"
env        = "dev"
tags = {
  "CreatedBy" = "Terraform"
  "Account"   = "dev"
  "Owner"     = "PagoPa"
  "Source"    = "https://github.com/pagopa/knodia"
}

ecr_cross_account_pull_account_ids = ["144349651087"]
