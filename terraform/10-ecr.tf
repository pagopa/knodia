locals {
  ecr_sources = {
    be    = { dir = "../apps/services/", prefix = "knodia-be-" }
    web   = { dir = "../apps/web/", prefix = "knodia-web-" }
    infra = { dir = "../apps/infra/", prefix = "knodia-infra-" }
  }

  computed_repository_names = flatten([
    for key, src in local.ecr_sources : [
      for d in distinct([
        for f in fileset(path.root, "${src.dir}*/*") :
        dirname(f)
      ]) :
      "${src.prefix}${replace(d, src.dir, "")}"
    ]
  ])

  ecr_cross_account_pull_enabled = var.env == "dev" && length(var.ecr_cross_account_pull_account_ids) > 0
}

resource "aws_ecr_repository" "app" {
  for_each = toset(local.computed_repository_names)

  image_tag_mutability = contains(["test", "prod"], var.env) ? "IMMUTABLE" : "MUTABLE"
  name                 = each.key
}

data "aws_iam_policy_document" "ecr_cross_account_pull" {
  count = local.ecr_cross_account_pull_enabled ? 1 : 0

  statement {
    sid    = "AllowCrossAccountPull"
    effect = "Allow"

    principals {
      type        = "AWS"
      identifiers = formatlist("arn:aws:iam::%s:root", var.ecr_cross_account_pull_account_ids)
    }

    actions = [
      "ecr:GetDownloadUrlForLayer",
      "ecr:BatchGetImage",
      "ecr:BatchCheckLayerAvailability",
    ]
  }
}

resource "aws_ecr_repository_policy" "cross_account_pull" {
  for_each = local.ecr_cross_account_pull_enabled ? aws_ecr_repository.app : {}

  repository = each.value.name
  policy     = data.aws_iam_policy_document.ecr_cross_account_pull[0].json
}

resource "aws_ecr_lifecycle_policy" "app" {
  for_each = { for repo in aws_ecr_repository.app : repo.name => repo if var.env == "dev" }

  repository = each.value.name
  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Delete untagged images"
        selection = {
          tagStatus   = "untagged"
          countType   = "sinceImagePushed"
          countUnit   = "days"
          countNumber = 1
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}
