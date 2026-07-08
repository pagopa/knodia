#!/usr/bin/env bash
#
# Seeds one Cognito user into a knode user-registry pool: creates the org group
# if missing, creates or updates the user with email + custom:roles, adds it to
# the group, sets a permanent password. Idempotent.
#
# Example:
#   ./scripts/seed/seed-cognito-user.sh \
#     --user-pool-id <user-pool-id> \
#     --username foo.bar \
#     --email foo.bar@example.com \
#     --roles administrative,technical \
#     --org-id 00000000-0000-4000-8000-000000000004 \
#     --password '<password>'
set -euo pipefail

REGION="eu-south-1"
ORG_DESCRIPTION=""

usage() {
  cat >&2 <<'EOF'
Usage: seed-cognito-user.sh --user-pool-id <id> --username <u> --email <e> \
         --roles <r1,r2,...> --org-id <uuid> --password <pw> \
         [--org-description <text>] [--region <aws-region>]

  --roles            comma-separated (e.g. administrative,technical)
  --org-id           organization UUID; the user is added to group org:<org-id>
                     (created if it does not exist yet)
  --org-description  description set on the group when it is created
  --region           defaults to eu-south-1
EOF
  exit 1
}

while [ $# -gt 0 ]; do
  case "$1" in
    --user-pool-id) USER_POOL_ID="$2"; shift 2;;
    --username) USERNAME="$2"; shift 2;;
    --email) EMAIL="$2"; shift 2;;
    --roles) ROLES="$2"; shift 2;;
    --org-id) ORG_ID="$2"; shift 2;;
    --password) PASSWORD="$2"; shift 2;;
    --org-description) ORG_DESCRIPTION="$2"; shift 2;;
    --region) REGION="$2"; shift 2;;
    *) echo "Unknown argument: $1" >&2; usage;;
  esac
done

for v in USER_POOL_ID USERNAME EMAIL ROLES ORG_ID PASSWORD; do
  if [ -z "${!v:-}" ]; then echo "Missing required --${v//_/-}" | tr '[:upper:]' '[:lower:]' >&2; usage; fi
done

GROUP="org:${ORG_ID}"
aws() { command aws --region "$REGION" "$@"; }

# 1) Ensure the org group exists (create-group is not idempotent; ignore if present).
if ! aws cognito-idp get-group --user-pool-id "$USER_POOL_ID" --group-name "$GROUP" >/dev/null 2>&1; then
  aws cognito-idp create-group --user-pool-id "$USER_POOL_ID" --group-name "$GROUP" \
    ${ORG_DESCRIPTION:+--description "$ORG_DESCRIPTION"} >/dev/null
  echo "Created group $GROUP"
fi

# 2) Create or update the user. Comma-valued custom:roles must go through JSON
# (the shorthand parser splits on commas). SUPPRESS: no invite email.
ATTRS="[{\"Name\":\"email\",\"Value\":\"$EMAIL\"},{\"Name\":\"email_verified\",\"Value\":\"true\"},{\"Name\":\"custom:roles\",\"Value\":\"$ROLES\"}]"
if aws cognito-idp admin-get-user --user-pool-id "$USER_POOL_ID" --username "$USERNAME" >/dev/null 2>&1; then
  aws cognito-idp admin-update-user-attributes --user-pool-id "$USER_POOL_ID" \
    --username "$USERNAME" --user-attributes "$ATTRS" >/dev/null
  echo "Updated user $USERNAME"
else
  aws cognito-idp admin-create-user --user-pool-id "$USER_POOL_ID" \
    --username "$USERNAME" --user-attributes "$ATTRS" --message-action SUPPRESS >/dev/null
  echo "Created user $USERNAME"
fi

# 3) Group membership (add is idempotent) and 4) permanent password (-> CONFIRMED).
aws cognito-idp admin-add-user-to-group --user-pool-id "$USER_POOL_ID" \
  --username "$USERNAME" --group-name "$GROUP"
aws cognito-idp admin-set-user-password --user-pool-id "$USER_POOL_ID" \
  --username "$USERNAME" --password "$PASSWORD" --permanent

echo "Seeded $USERNAME -> $GROUP (roles: $ROLES) — CONFIRMED"
