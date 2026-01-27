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

# Find already converted Drizzle files by reading source comments from Flyway files
declare -A converted_files
if [ -d "$MIGRATIONS_DIR" ]; then
  for flyway_file in "$MIGRATIONS_DIR"/V*.sql; do
    [ -e "$flyway_file" ] || continue
    # Extract source filename from comment: -- Drizzle source: 0001_name.sql
    source_file=$(grep "^-- Drizzle source:" "$flyway_file" 2>/dev/null | sed 's/^-- Drizzle source: //')
    if [ -n "$source_file" ]; then
      converted_files["$source_file"]=1
    fi
  done
fi

# Find the highest existing Flyway version number
max_version=0
if [ -d "$MIGRATIONS_DIR" ]; then
  for flyway_file in "$MIGRATIONS_DIR"/V*.sql; do
    [ -e "$flyway_file" ] || continue
    # Extract version number (e.g., V001 -> 1, V042 -> 42)
    version=$(basename "$flyway_file" | sed 's/^V0*\([0-9]*\)__.*/\1/')
    if [ -n "$version" ] && [ "$version" -gt "$max_version" ]; then
      max_version=$version
    fi
  done
fi

# Start from next version
VERSION=$((max_version + 1))

NEW_COUNT=0
SKIPPED_COUNT=0

echo "Checking for new Drizzle migrations..."

# Process each SQL file
for file in "$DRIZZLE_DIR"/*.sql; do
  [ -e "$file" ] || continue

  filename=$(basename "$file")

  # Check if already converted
  if [ -n "${converted_files[$filename]}" ]; then
    SKIPPED_COUNT=$((SKIPPED_COUNT + 1))
    continue
  fi

  # Remove Drizzle-specific comments (all --> comments) and clean content
  sed 's/-->.*$//g' "$file" | sed '/^$/N;/^\n$/D' > /tmp/cleaned.sql

  # Generate Flyway filename: V{version}__{description}.sql
  # Version is zero-padded to 3 digits (or more if needed)
  if [ "$VERSION" -lt 1000 ]; then
    version_padded=$(printf "%03d" $VERSION)
  else
    version_padded=$(printf "%d" $VERSION)
  fi

  # Extract description from original filename
  # Remove leading numbers and .sql extension, replace hyphens with underscores
  description=$(echo "$filename" | sed 's/^[0-9]*_//' | sed 's/\.sql$//' | sed 's/-/_/g')

  flyway_filename="V${version_padded}__${description}.sql"
  flyway_path="$MIGRATIONS_DIR/$flyway_filename"

  # Write to Flyway migrations directory with source comment
  {
    echo "-- Drizzle source: $filename"
    cat /tmp/cleaned.sql
  } > "$flyway_path"

  echo "  ✓ $filename → $flyway_filename"

  NEW_COUNT=$((NEW_COUNT + 1))
  VERSION=$((VERSION + 1))
done

rm -f /tmp/cleaned.sql

echo ""
if [ "$NEW_COUNT" -gt 0 ]; then
  echo "Converted $NEW_COUNT new migration(s) to Flyway format"
fi
if [ "$SKIPPED_COUNT" -gt 0 ]; then
  echo "Skipped $SKIPPED_COUNT already converted migration(s)"
fi
echo "Migrations directory: $MIGRATIONS_DIR"
