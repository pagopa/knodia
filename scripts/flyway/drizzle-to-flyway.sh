#!/bin/bash
set -euo pipefail

# Check bash version supports associative arrays (4.0+)
if [ "${BASH_VERSINFO[0]}" -lt 4 ]; then
  echo "Error: This script requires Bash 4.0 or higher (current: ${BASH_VERSION})"
  exit 1
fi

# Get arguments: db-type (event-store or readmodel) and schema name (eservice, agreement, etc.)
DB_TYPE=$1
SCHEMA_NAME=$2

if [ -z "$DB_TYPE" ] || [ -z "$SCHEMA_NAME" ]; then
  echo "Usage: ./drizzle-to-flyway.sh <event-store|readmodel> <schema-name>"
  exit 1
fi

# Validate DB_TYPE
if [ "$DB_TYPE" != "event-store" ] && [ "$DB_TYPE" != "readmodel" ]; then
  echo "Error: DB_TYPE must be either 'event-store' or 'readmodel', got: $DB_TYPE"
  exit 1
fi

# Validate SCHEMA_NAME format (alphanumeric, hyphens, underscores only)
if ! [[ "$SCHEMA_NAME" =~ ^[a-zA-Z0-9_-]+$ ]]; then
  echo "Error: Invalid SCHEMA_NAME format: $SCHEMA_NAME"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
DRIZZLE_DIR="$PROJECT_ROOT/packages/db/$DB_TYPE/$SCHEMA_NAME/drizzle"
MIGRATIONS_DIR="$PROJECT_ROOT/flyway/$DB_TYPE/$SCHEMA_NAME"

# Create temporary file with proper cleanup trap
TEMP_FILE=$(mktemp) || { echo "Error: Failed to create temporary file"; exit 1; }
trap 'rm -f "$TEMP_FILE"' EXIT INT TERM

# Check if drizzle directory exists and is readable
if [ ! -d "$DRIZZLE_DIR" ]; then
  echo "Error: Drizzle directory not found: $DRIZZLE_DIR"
  exit 1
fi

if [ ! -r "$DRIZZLE_DIR" ]; then
  echo "Error: Cannot read drizzle directory: $DRIZZLE_DIR"
  exit 1
fi

# Create migrations directory if it doesn't exist
if ! mkdir -p "$MIGRATIONS_DIR"; then
  echo "Error: Failed to create migrations directory: $MIGRATIONS_DIR"
  exit 1
fi

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
    [ -r "$flyway_file" ] || continue
    # Extract source filename from comment: -- Drizzle source: 0001_name.sql
    source_file=$(grep "^-- Drizzle source:" "$flyway_file" 2>/dev/null | sed 's/^-- Drizzle source: //' | tr -d '[:space:]')
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
    filename=$(basename "$flyway_file")
    # Extract version number (e.g., V001 -> 1, V042 -> 42)
    # Validate filename format: V<digits>__<description>.sql
    if [[ "$filename" =~ ^V([0-9]+)__.*\.sql$ ]]; then
      version="${BASH_REMATCH[1]}"
      # Remove leading zeros for comparison
      version=$((10#$version))
      if [ "$version" -gt "$max_version" ]; then
        max_version=$version
      fi
    else
      echo "Warning: Ignoring file with invalid Flyway format: $filename"
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

  # Validate SQL file is readable
  if [ ! -r "$file" ]; then
    echo "Warning: Cannot read file: $file"
    continue
  fi

  # Check if already converted
  if [ -n "${converted_files[$filename]}" ]; then
    SKIPPED_COUNT=$((SKIPPED_COUNT + 1))
    continue
  fi

  # Remove Drizzle-specific comments (all --> comments) and clean content
  if ! sed 's/-->.*$//g' "$file" | sed '/^$/N;/^\n$/D' > "$TEMP_FILE"; then
    echo "Error: Failed to process file: $file"
    continue
  fi

  # Validate cleaned file is not empty
  if [ ! -s "$TEMP_FILE" ]; then
    echo "Warning: Processed file is empty, skipping: $filename"
    continue
  fi

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

  # Validate description is not empty
  if [ -z "$description" ]; then
    echo "Warning: Could not extract description from filename: $filename"
    description="migration"
  fi

  flyway_filename="V${version_padded}__${description}.sql"
  flyway_path="$MIGRATIONS_DIR/$flyway_filename"

  # Check if target file already exists
  if [ -e "$flyway_path" ]; then
    echo "Error: Target file already exists: $flyway_path"
    continue
  fi

  # Write to Flyway migrations directory with source comment
  if ! {
    echo "-- Drizzle source: $filename"
    cat "$TEMP_FILE"
  } > "$flyway_path"; then
    echo "Error: Failed to write migration file: $flyway_path"
    continue
  fi

  echo "  ✓ $filename → $flyway_filename"

  NEW_COUNT=$((NEW_COUNT + 1))
  VERSION=$((VERSION + 1))
done

echo ""
echo "Summary:"
echo "--------"
if [ "$NEW_COUNT" -gt 0 ]; then
  echo "✓ Converted $NEW_COUNT new migration(s) to Flyway format"
else
  echo "ℹ No new migrations to convert"
fi
if [ "$SKIPPED_COUNT" -gt 0 ]; then
  echo "⊘ Skipped $SKIPPED_COUNT already converted migration(s)"
fi
echo ""
echo "Migrations directory: $MIGRATIONS_DIR"

exit 0
