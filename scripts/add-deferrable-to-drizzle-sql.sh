#!/bin/bash
set -euo pipefail

# Get argument: schema name (eservice, agreement, etc.)
SCHEMA_NAME=$1

if [ -z "$SCHEMA_NAME" ]; then
  echo "Usage: ./drizzle-to-flyway.sh <schema-name>"
  exit 1
fi

# Validate SCHEMA_NAME format (alphanumeric, hyphens, underscores only)
if ! [[ "$SCHEMA_NAME" =~ ^[a-zA-Z0-9_-]+$ ]]; then
  echo "Error: Invalid SCHEMA_NAME format: $SCHEMA_NAME"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(git rev-parse --show-toplevel)"
DRIZZLE_DIR="$PROJECT_ROOT/packages/db/readmodel/$SCHEMA_NAME/drizzle"

if [ ! -d "$DRIZZLE_DIR" ]; then
  echo "Error: Drizzle directory not found: $DRIZZLE_DIR"
  exit 1
fi

# Find .sql files (usually there's just one, but this is future-proof)
SQL_FILES=$(find "$DRIZZLE_DIR" -type f -name "*.sql")

if [ -z "$SQL_FILES" ]; then
  echo "Error: No SQL files found in $DRIZZLE_DIR"
  exit 1
fi

echo "Updating generated Drizzle SQL files in:"
echo "$SQL_FILES"

for FILE in $SQL_FILES; do
  echo "→ Processing $FILE"

  # Add IF NOT EXISTS to CREATE SCHEMA statements
  sed -i.bak -E 's/^CREATE SCHEMA (")/CREATE SCHEMA IF NOT EXISTS \1/' "$FILE"

  # Add IF NOT EXISTS to CREATE TABLE statements
  sed -i.bak -E 's/^CREATE TABLE (")/CREATE TABLE IF NOT EXISTS \1/' "$FILE"

  # For each ADD CONSTRAINT statement, add a DROP CONSTRAINT IF EXISTS before it 
  sed -i.bak -E '/ALTER TABLE .* ADD CONSTRAINT/ {
    /--updated/ ! {
      s/ALTER TABLE ("[^"]+"\."[^"]+") ADD CONSTRAINT ("[^"]+") (.*);/ALTER TABLE \1 DROP CONSTRAINT IF EXISTS \2; --added --> statement-breakpoint\
ALTER TABLE \1 ADD CONSTRAINT \2 \3; --updated /
    }
  }' "$FILE"


  # Add DEFERRABLE INITIALLY DEFERRED to all FOREIGN KEY constraints that don't already have it
  sed -i.bak -E '
    /ALTER TABLE .* ADD CONSTRAINT .*FOREIGN KEY/ {
      /DEFERRABLE INITIALLY DEFERRED/! {
        s/(;[[:space:]]*--updated( --> statement-breakpoint)?)/ DEFERRABLE INITIALLY DEFERRED\1/
      }
    }
  ' "$FILE"

  rm "$FILE.bak"
done

echo "Done"
