#!/usr/bin/env bash
#
# Seeds the readmodel DB and the e-service-interfaces S3 bucket.
#
# Locally: runs as init container via `pnpm infra:start` and `pnpm multinode:start`.
# Remote envs (e.g. dev/test): run manually over VPN, once per tenant. Seed user needs
# USAGE + SELECT/INSERT/UPDATE on the <namespace>_organization and
# <namespace>_eservice schemas (UPDATE required by ON CONFLICT DO UPDATE in the
# SQL). RDS host, DB names and bucket names come from
# pagopa/knodia-deployment commons/<env>/values-commons-{orion,lynx}.yaml.
#
# Required env: PGHOST, PGDATABASE, PGUSER, PGPASSWORD, NAMESPACE (e.g. local,
# dev_orion), ENVIRONMENT (e.g. local, dev), SQL_DIR, S3_BUCKET, AWS_REGION,
# AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY.
# Optional:     PGPORT, PGSSLMODE (require on remote envs), S3_ENDPOINT_URL (MinIO only).
#
# Dev example (orion):
#   PGHOST=knodia-platform-data-dev.cluster-cjkmiqcymbbp.eu-south-1.rds.amazonaws.com \
#   PGDATABASE=dev_orion_read_model PGUSER=<seed_user> PGPASSWORD=<...> \
#   PGSSLMODE=require NAMESPACE=dev_orion \
#   ENVIRONMENT=dev \
#   SQL_DIR=./scripts/seed/sql/orion \
#   S3_BUCKET=knodia-application-documents-dev-orion \
#   AWS_REGION=eu-south-1 \
#   ./scripts/seed/seed.sh
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

for f in "$SQL_DIR"/*.sql; do
  sed -e "s/\${NAMESPACE}/$NAMESPACE/g" \
      -e "s/\${ENVIRONMENT}/$ENVIRONMENT/g" \
      < "$f" | psql -v ON_ERROR_STOP=1
done

# The s3 key prefix MUST match the `path` of an eservice_interface row in the SQL.
aws ${S3_ENDPOINT_URL:+--endpoint-url "$S3_ENDPOINT_URL"} s3 cp \
  "$REPO_ROOT/apps/services/mock-eservice/openapi/openapi-bearer.yaml" \
  "s3://$S3_BUCKET/d44bcdeb-d0dc-46c3-abf6-dd2862fdd7ad/mock-bearer-eservice.yaml"

aws ${S3_ENDPOINT_URL:+--endpoint-url "$S3_ENDPOINT_URL"} s3 cp \
  "$REPO_ROOT/apps/services/mock-eservice/openapi/openapi-dpop.yaml" \
  "s3://$S3_BUCKET/e522049f-2301-442a-91de-e5bcaffd08be/mock-dpop-eservice.yaml"

aws ${S3_ENDPOINT_URL:+--endpoint-url "$S3_ENDPOINT_URL"} s3 cp \
  "$REPO_ROOT/apps/services/mock-eservice/openapi/openapi-bearer-signal-hub.yaml" \
  "s3://$S3_BUCKET/e5540a33-703e-4527-9880-05e7d347f93e/mock-bearer-signal-hub-eservice.yaml"

aws ${S3_ENDPOINT_URL:+--endpoint-url "$S3_ENDPOINT_URL"} s3 cp \
  "$REPO_ROOT/apps/services/mock-eservice/openapi/openapi-bearer-companies.yaml" \
  "s3://$S3_BUCKET/f26b46b5-b440-45f2-a774-e6e218f92c61/mock-bearer-companies-eservice.yaml"
