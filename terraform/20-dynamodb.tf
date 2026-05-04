locals {
  dpop_proofs_tables = {
    "knodia-auth-server-dpop-proofs-${var.env}-orion"   = {}
    "knodia-auth-server-dpop-proofs-${var.env}-lynx"    = {}
    "knodia-mock-eservice-dpop-proofs-${var.env}-orion" = {}
    "knodia-mock-eservice-dpop-proofs-${var.env}-lynx"  = {}
  }
}

resource "aws_dynamodb_table" "dpop_proofs" {
  for_each = local.dpop_proofs_tables

  name         = each.key
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "jti"

  attribute {
    name = "jti"
    type = "S"
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }
}
