#!/usr/bin/env bash
#
# Seeds the readmodel DB and the e-service-interfaces S3 bucket.
#
# Locally: runs as init container via `pnpm infra:start` and `pnpm multinode:start`.
# Remote envs (e.g. dev/test): run manually over VPN, once per tenant. Seed user needs
# USAGE + SELECT/INSERT/UPDATE on the <namespace>_organization, <namespace>_eservice
# and <namespace>_keychain schemas (UPDATE required by ON CONFLICT DO UPDATE in the
# SQL). RDS host, DB names and bucket names come from
# pagopa/knodia-deployment commons/<env>/values-commons-{orion,lynx}.yaml.
#
# Required env: PGHOST, PGDATABASE, PGUSER, PGPASSWORD, NAMESPACE (e.g. local,
# dev_orion), ENVIRONMENT (e.g. local, dev), SQL_DIR, S3_BUCKET, AWS_REGION,
# AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY.
# Optional:     PGPORT, PGSSLMODE (require on remote envs), S3_ENDPOINT_URL (MinIO only).
#
# Integrity REST 02 producer key (Lynx only). INTEGRITY_KEY_ENV_FILE is written by
# the local KMS setup for the seed init container, which has no Node/KMS to derive it;
# a manual run instead sets INTEGRITY_PRODUCER_KEY_KMS_ALIAS and self-derives.
#
# Dev example (orion):
#   PGHOST=knodia-platform-data-dev.cluster-cjkmiqcymbbp.eu-south-1.rds.amazonaws.com \
#   PGDATABASE=dev_orion_read_model PGUSER=<seed_user> PGPASSWORD=<...> \
#   PGSSLMODE=require NAMESPACE=dev_orion \
#   ENVIRONMENT=dev \
#   SQL_DIR=./scripts/seed/sql/orion \
#   S3_BUCKET=knodia-application-documents-dev-orion \
#   AWS_REGION=eu-south-1 \
#   INTEGRITY_PRODUCER_KEY_KMS_ALIAS=alias/<env-integrity-signing-key> \  # Lynx only
#   ./scripts/seed/seed.sh
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

INTEGRITY_KEYCHAIN_SQL="mock-integrity-rest-02-producer-keychain.sql"

if [ -n "${INTEGRITY_KEY_ENV_FILE:-}" ] && [ -f "$INTEGRITY_KEY_ENV_FILE" ]; then
  . "$INTEGRITY_KEY_ENV_FILE"
elif [ -n "${INTEGRITY_PRODUCER_KEY_KMS_ALIAS:-}" ] && command -v node >/dev/null 2>&1; then
  # Capture + check before eval: a failing derive inside `eval "$(...)"` would be
  # swallowed (eval succeeds on empty output) despite `set -euo pipefail`.
  integrity_key_env="$(node "$REPO_ROOT/scripts/seed/derive-integrity-producer-key.ts")" || {
    echo "Failed to derive integrity producer key for alias '$INTEGRITY_PRODUCER_KEY_KMS_ALIAS'" >&2
    exit 1
  }
  eval "$integrity_key_env"
fi

# Use | as the sed delimiter for the key vars: base64/base64url never contain it.
for f in "$SQL_DIR"/*.sql; do
  if [ "$(basename "$f")" = "$INTEGRITY_KEYCHAIN_SQL" ] && [ -z "${KID:-}" ]; then
    echo "Skipping $INTEGRITY_KEYCHAIN_SQL (no integrity producer key resolved)"
    continue
  fi
  sed -e "s/\${NAMESPACE}/$NAMESPACE/g" \
      -e "s/\${ENVIRONMENT}/$ENVIRONMENT/g" \
      -e "s|\${KID}|${KID:-}|g" \
      -e "s|\${ENCODED_PEM}|${ENCODED_PEM:-}|g" \
      < "$f" | psql -v ON_ERROR_STOP=1
done

# The s3 key prefix MUST match the `path` of an eservice_interface row in the SQL.
# Each interface is uploaded only to the knode whose $SQL_DIR seeds the mock, so a
# multinode run never leaves orphan specs on the wrong node.
if [ -f "$SQL_DIR/mock-bearer-eservice.sql" ]; then
  aws ${S3_ENDPOINT_URL:+--endpoint-url "$S3_ENDPOINT_URL"} s3 cp \
    "$REPO_ROOT/apps/services/mock-eservice/openapi/openapi-bearer.yaml" \
    "s3://$S3_BUCKET/d44bcdeb-d0dc-46c3-abf6-dd2862fdd7ad/mock-bearer-eservice.yaml"
fi

if [ -f "$SQL_DIR/mock-dpop-eservice.sql" ]; then
  aws ${S3_ENDPOINT_URL:+--endpoint-url "$S3_ENDPOINT_URL"} s3 cp \
    "$REPO_ROOT/apps/services/mock-eservice/openapi/openapi-dpop.yaml" \
    "s3://$S3_BUCKET/e522049f-2301-442a-91de-e5bcaffd08be/mock-dpop-eservice.yaml"
fi

if [ -f "$SQL_DIR/mock-signal-hub-eservice.sql" ]; then
  aws ${S3_ENDPOINT_URL:+--endpoint-url "$S3_ENDPOINT_URL"} s3 cp \
    "$REPO_ROOT/apps/services/mock-eservice/openapi/openapi-bearer-signal-hub.yaml" \
    "s3://$S3_BUCKET/e5540a33-703e-4527-9880-05e7d347f93e/mock-bearer-signal-hub-eservice.yaml"
fi

if [ -f "$SQL_DIR/mock-poc-uc02-companies-eservice.sql" ]; then
  aws ${S3_ENDPOINT_URL:+--endpoint-url "$S3_ENDPOINT_URL"} s3 cp \
    "$REPO_ROOT/apps/services/mock-eservice/openapi/openapi-bearer-poc-uc02-companies.yaml" \
    "s3://$S3_BUCKET/f26b46b5-b440-45f2-a774-e6e218f92c61/mock-bearer-poc-uc02-companies-eservice.yaml"
fi

if [ -f "$SQL_DIR/mock-poc-uc01-qualifications-eservice.sql" ]; then
  aws ${S3_ENDPOINT_URL:+--endpoint-url "$S3_ENDPOINT_URL"} s3 cp \
    "$REPO_ROOT/apps/services/mock-eservice/openapi/openapi-bearer-poc-uc01-qualifications.yaml" \
    "s3://$S3_BUCKET/72937dcf-e40b-4fa9-8e54-33a21407d19c/mock-bearer-poc-uc01-qualifications-eservice.yaml"
fi

if [ -f "$SQL_DIR/mock-poc-uc01-set-qualification-eservice.sql" ]; then
  aws ${S3_ENDPOINT_URL:+--endpoint-url "$S3_ENDPOINT_URL"} s3 cp \
    "$REPO_ROOT/apps/services/mock-eservice/openapi/openapi-bearer-poc-uc01-set-qualification.yaml" \
    "s3://$S3_BUCKET/ff8bebc1-5e1c-4f8d-8611-03e18354558f/mock-bearer-poc-uc01-set-qualification-eservice.yaml"
fi

if [ -f "$SQL_DIR/mock-integrity-rest-02-eservice.sql" ]; then
  aws ${S3_ENDPOINT_URL:+--endpoint-url "$S3_ENDPOINT_URL"} s3 cp \
    "$REPO_ROOT/apps/services/mock-eservice/openapi/openapi-bearer-integrity-rest-02.yaml" \
    "s3://$S3_BUCKET/62708c81-8862-48bf-8140-49804d18c7e6/mock-bearer-integrity-rest-02-eservice.yaml"
fi

if [ -f "$SQL_DIR/mock-async-consumption-eservice.sql" ]; then
  aws ${S3_ENDPOINT_URL:+--endpoint-url "$S3_ENDPOINT_URL"} s3 cp \
    "$REPO_ROOT/apps/services/mock-eservice/openapi/openapi-bearer-async-consumption.yaml" \
    "s3://$S3_BUCKET/7add7dfd-dece-44e4-9d21-7a9c9404506a/mock-bearer-async-consumption-eservice.yaml"
fi

# Orion-only seed: matches scripts/seed/sql/orion/mock-poc-uc03-supervisory-body-eservice.sql.
# Uploaded only when the SQL is present in $SQL_DIR (the supervisory body is on Orion).
if [ -f "$SQL_DIR/mock-poc-uc03-supervisory-body-eservice.sql" ]; then
  aws ${S3_ENDPOINT_URL:+--endpoint-url "$S3_ENDPOINT_URL"} s3 cp \
    "$REPO_ROOT/apps/services/mock-eservice/openapi/openapi-bearer-poc-uc03-supervisory-body.yaml" \
    "s3://$S3_BUCKET/a3f1c8e0-1b2c-4d3e-8f40-000000000303/mock-bearer-poc-uc03-supervisory-body-eservice.yaml"
fi

# POC UC03 relay: both SERCs publish it, one per knode with a distinct interface
# id (see scripts/seed/sql/{lynx,orion}/mock-poc-uc03-relay-eservice.sql). Same
# spec, uploaded under this knode's interface id. NAMESPACE selects the knode
# (single-node 'local' seeds the orion dir, so it falls to the orion id).
if [ -f "$SQL_DIR/mock-poc-uc03-relay-eservice.sql" ]; then
  case "$NAMESPACE" in
    *lynx*) UC03_RELAY_INTERFACE_ID="b4e2d9f1-2c3d-4e4f-9a51-000000000313" ;;
    *) UC03_RELAY_INTERFACE_ID="c5f3e0a2-3d4e-4f5a-ab62-000000000323" ;;
  esac
  aws ${S3_ENDPOINT_URL:+--endpoint-url "$S3_ENDPOINT_URL"} s3 cp \
    "$REPO_ROOT/apps/services/mock-eservice/openapi/openapi-bearer-poc-uc03-relay.yaml" \
    "s3://$S3_BUCKET/$UC03_RELAY_INTERFACE_ID/mock-bearer-poc-uc03-relay-eservice.yaml"
fi

# Lynx-only seed: matches scripts/seed/sql/lynx/mock-receive-data-eservice.sql.
# Other tenants don't ship this mock yet, so we only upload when the SQL is
# present in $SQL_DIR.
if [ -f "$SQL_DIR/mock-receive-data-eservice.sql" ]; then
  aws ${S3_ENDPOINT_URL:+--endpoint-url "$S3_ENDPOINT_URL"} s3 cp \
    "$REPO_ROOT/apps/services/mock-eservice/openapi/openapi-bearer-receive-data.yaml" \
    "s3://$S3_BUCKET/d3f6c2e5-9a4b-4f83-be39-3c6d0d5e7e2a/mock-receive-data-eservice.yaml"
fi
