locals {
  computed_be_repository_dir = "../apps/services/"
  computed_be_repository_names = [
    for d in distinct([
      for f in fileset(path.root, "${local.computed_be_repository_dir}*/*") :
      dirname(f)
    ]) :
    "knodia-be-${replace(d, local.computed_be_repository_dir, "")}"
  ]

  computed_fe_repository_dir = "../apps/web/"
  computed_fe_repository_names = [
    for d in distinct([
      for f in fileset(path.root, "${local.computed_fe_repository_dir}*/*") :
      dirname(f)
    ]) :
    "knodia-web-${trimsuffix(replace(d, local.computed_fe_repository_dir, ""), "-frontend")}"
  ]
}

resource "aws_ecr_repository" "app" {
  for_each = toset(concat(local.computed_be_repository_names, local.computed_fe_repository_names))

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
