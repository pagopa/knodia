variable "aws_region" {
  type        = string
  description = "AWS region"
}

variable "env" {
  type        = string
  description = "Environment name"
}

variable "ecr_cross_account_pull_account_ids" {
  type        = list(string)
  description = "List of AWS account IDs allowed to pull from ECR repositories"
  default     = []
}

variable "tags" {
  type        = map(any)
  description = "Tags applied to all resources that support them"
  default = {
    "CreatedBy" : "Terraform",
  }
}
