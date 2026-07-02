#!/usr/bin/env bash
#
# Seeds every POC use-case user (UC01/02/03) across the two knode pools by
# calling seed-cognito-user.sh once per user. Idempotent (create-or-update).
#
# Org ids and usernames mirror scripts/seed/sql/{lynx,orion}/mock-poc-*-organizations.sql
# and scripts/local-auth/local-cognito.mjs. All POC users hold both roles — the
# demos don't cover role-based behaviour. Emails are placeholders (no real inbox).
#
# Pool ids per env come from pagopa/knodia-deployment
# commons/knodes/<env>/values-commons-{lynx,orion}.yaml (cognito.userPoolId).
#
# Example:
#   ./scripts/seed/seed-poc-users.sh \
#     --lynx-pool-id <lynx-user-pool-id> \
#     --orion-pool-id <orion-user-pool-id> \
#     --password '<password>'
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SEED_USER="$SCRIPT_DIR/seed-cognito-user.sh"
REGION="eu-south-1"
ROLES="administrative,technical"
ORG_PREFIX="00000000-0000-4000-8000-0000000001"

usage() {
  cat >&2 <<'EOF'
Usage: seed-poc-users.sh --lynx-pool-id <id> --orion-pool-id <id> --password <pw> \
         [--region <aws-region>]
EOF
  exit 1
}

while [ $# -gt 0 ]; do
  case "$1" in
    --lynx-pool-id) LYNX_POOL_ID="$2"; shift 2;;
    --orion-pool-id) ORION_POOL_ID="$2"; shift 2;;
    --password) PASSWORD="$2"; shift 2;;
    --region) REGION="$2"; shift 2;;
    *) echo "Unknown argument: $1" >&2; usage;;
  esac
done

for v in LYNX_POOL_ID ORION_POOL_ID PASSWORD; do
  if [ -z "${!v:-}" ]; then echo "Missing required --${v//_/-}" | tr '[:upper:]' '[:lower:]' >&2; usage; fi
done

# knode|username|org-id-suffix (suffix appended to ORG_PREFIX)
POC_USERS="
lynx|student_registry_lynx_admin|03
lynx|business_booklet_lynx_admin|01
lynx|system_serc_lynx_admin|05
orion|academy_orion_admin|04
orion|construction_companies_registry_orion_admin|02
orion|supervisory_body_orion_admin|07
orion|system_serc_orion_admin|06
"

echo "$POC_USERS" | while IFS='|' read -r knode username suffix; do
  [ -z "$username" ] && continue
  case "$knode" in
    lynx) pool="$LYNX_POOL_ID";;
    orion) pool="$ORION_POOL_ID";;
  esac
  "$SEED_USER" \
    --user-pool-id "$pool" \
    --username "$username" \
    --email "${username}@poc.knodia.dev" \
    --roles "$ROLES" \
    --org-id "${ORG_PREFIX}${suffix}" \
    --password "$PASSWORD" \
    --region "$REGION"
done
