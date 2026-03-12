locals {
  ecr_sources = {
    be    = { dir = "../apps/services/", prefix = "knodia-be-", trim_suffix = "" }
    web   = { dir = "../apps/web/", prefix = "knodia-web-", trim_suffix = "-frontend" }
    infra = { dir = "../apps/infra/", prefix = "knodia-infra-", trim_suffix = "" }
  }

  computed_repository_names = flatten([
    for key, src in local.ecr_sources : [
      for d in distinct([
        for f in fileset(path.root, "${src.dir}*/*") :
        dirname(f)
      ]) :
      "${src.prefix}${trimsuffix(replace(d, src.dir, ""), src.trim_suffix)}"
    ]
  ])
}

resource "aws_ecr_repository" "app" {
  for_each = toset(local.computed_repository_names)

  image_tag_mutability = contains(["test", "prod"], var.env) ? "IMMUTABLE" : "MUTABLE"
  name                 = each.key
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
