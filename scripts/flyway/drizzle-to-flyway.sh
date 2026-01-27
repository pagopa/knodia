#!/bin/bash
set -e

# Get arguments: db-type (event-store or readmodel) and schema name (eservice, agreement, etc.)
DB_TYPE=$1
SCHEMA_NAME=$2

if [ -z "$DB_TYPE" ] || [ -z "$SCHEMA_NAME" ]; then
  echo "Usage: ./drizzle-to-flyway.sh <event-store|readmodel> <schema-name>"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
DRIZZLE_DIR="$PROJECT_ROOT/packages/db/$DB_TYPE/$SCHEMA_NAME/drizzle"
MIGRATIONS_DIR="$PROJECT_ROOT/flyway/$DB_TYPE/$SCHEMA_NAME"

# Check if drizzle directory exists
if [ ! -d "$DRIZZLE_DIR" ]; then
  echo "Drizzle directory not found: $DRIZZLE_DIR"
  exit 1
fi

# Create migrations directory if it doesn't exist
mkdir -p "$MIGRATIONS_DIR"

# Count SQL files
SQL_FILES=("$DRIZZLE_DIR"/*.sql)
if [ ! -e "${SQL_FILES[0]}" ]; then
  echo "No Drizzle migrations found in $DRIZZLE_DIR"
  exit 0
fi

FILE_COUNT=$(ls -1 "$DRIZZLE_DIR"/*.sql 2>/dev/null | wc -l)
echo "Converting $FILE_COUNT Drizzle migration(s) to Flyway format..."

# Process each SQL file
VERSION=1
for file in "$DRIZZLE_DIR"/*.sql; do
  [ -e "$file" ] || continue

  filename=$(basename "$file")

  # Remove Drizzle-specific comments (all --> comments) and clean content
  sed 's/-->.*$//g' "$file" | sed '/^$/N;/^\n$/D' > /tmp/cleaned.sql

  # Generate Flyway filename: V{version}__{description}.sql
  # Version is zero-padded to 3 digits
  version_padded=$(printf "%03d" $VERSION)

  # Extract description from original filename
  # Remove leading numbers and .sql extension, replace hyphens with underscores
  description=$(echo "$filename" | sed 's/^[0-9]*_//' | sed 's/\.sql$//' | sed 's/-/_/g')

  flyway_filename="V${version_padded}__${description}.sql"
  flyway_path="$MIGRATIONS_DIR/$flyway_filename"

  # Write to Flyway migrations directory
  cp /tmp/cleaned.sql "$flyway_path"

  echo "  ✓ $filename → $flyway_filename"

  VERSION=$((VERSION + 1))
done

rm -f /tmp/cleaned.sql

echo ""
echo "Migrations converted successfully to: $MIGRATIONS_DIR"
