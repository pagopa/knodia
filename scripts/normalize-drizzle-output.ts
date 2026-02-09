/**
 * Post-process drizzle-kit pull output to fix known issues.
 *
 * This script reads the drizzle-kit generated schema file from the `generated/`
 * folder, applies transformations, and overwrites the file in place.
 *
 * WORKFLOW:
 * 1. Run `pnpm db:pull` (runs drizzle-kit pull + this script automatically)
 * 2. Copy the content of generated/schema.ts to src/eservice.ts
 * 3. Replace the hardcoded schema name with the config-based value (see comment in file)
 * 4. Remove the instruction comment block
 *
 * NOTE: The entire `generated/` folder is gitignored.
 *
 * TRANSFORMATIONS APPLIED:
 *
 * 1. ADD SCHEMA REPLACEMENT INSTRUCTION COMMENT
 *    Adds a comment block with instructions for replacing the hardcoded schema name.
 *
 * 2. REPLACE UNKNOWN BYTEA COLUMNS WITH CUSTOM TYPE (event-store only)
 *    Replaces `unknown("column")` with `eventStoreBytea("column")` for bytea columns.
 *
 * 3. FIX TIMESTAMP MODE FROM STRING TO DATE
 *    Changes `mode: 'string'` to `mode: "date"` for proper Date object handling.
 *
 * 4. GENERATE TYPE EXPORTS FOR ALL TABLES
 *    Creates TypeScript type exports using $inferSelect and $inferInsert.
 *
 * 5. DEDUPLICATE RELATION PROPERTIES (relations.ts)
 *    Removes duplicate property keys in relations() object literals caused by
 *    drizzle-kit generating one entry per FK when multiple FKs reference the
 *    same table from the same column.
 *
 * Usage: node --experimental-strip-types scripts/normalize-drizzle-output.ts [schema-file-path]
 *
 * If no path is provided, defaults to: generated/schema.ts
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { argv, cwd, exit } from "node:process";

// =============================================================================
// TYPES
// =============================================================================

interface ConfigInfo {
  envVarName: string;
  configPropertyName: string;
  configObjectName: string;
  isEventStore: boolean;
}

// =============================================================================
// CONFIGURATION PARSING
// =============================================================================

/**
 * Reads and parses the config/config.ts file to extract schema configuration.
 *
 * Extracts:
 * - Environment variable name (e.g., EVENTSTORE_DB_ESERVICE_SCHEMA)
 * - Config property name (e.g., eventStoreDbEserviceSchema)
 * - Config object name (e.g., eventStoreEserviceConfig)
 * - Whether this is an event-store package (for bytea column handling)
 */
function parseConfigFile(): ConfigInfo {
  const configPath = resolve(cwd(), "config/config.ts");

  if (!existsSync(configPath)) {
    console.error(`Error: Config file not found: ${configPath}`);
    console.error(
      "This script must be run from a db package directory (e.g., packages/db/event-store/eservice/)",
    );
    exit(1);
  }

  const configContent = readFileSync(configPath, "utf-8");

  // Extract environment variable name (e.g., READMODEL_DB_ESERVICE_SCHEMA)
  const envVarMatch = configContent.match(
    /([A-Z][A-Z0-9_]*_SCHEMA):\s*z\.string\(\)/,
  );
  if (!envVarMatch) {
    console.error(
      "Error: Could not find schema env var pattern (*_SCHEMA: z.string()) in config file.",
    );
    exit(1);
  }
  const envVarName = envVarMatch[1];

  // Extract config property name (e.g., readModelDbEserviceSchema)
  const propertyMatch = configContent.match(
    /([a-z][a-zA-Z]*Schema):\s*c\.[A-Z]/,
  );
  if (!propertyMatch) {
    console.error(
      "Error: Could not find config property pattern (*Schema: c.*) in config file.",
    );
    exit(1);
  }
  const configPropertyName = propertyMatch[1];

  // Extract config object name (e.g., readModelEserviceConfig)
  const objectMatch = configContent.match(
    /export const ([a-z][a-zA-Z]*Config):\s*[A-Z]/,
  );
  if (!objectMatch) {
    console.error(
      "Error: Could not find config object export pattern (export const *Config:) in config file.",
    );
    exit(1);
  }
  const configObjectName = objectMatch[1];

  // Determine package type based on environment variable prefix
  const isEventStore = envVarName.startsWith("EVENTSTORE_");

  return {
    envVarName,
    configPropertyName,
    configObjectName,
    isEventStore,
  };
}

// =============================================================================
// TRANSFORMATION 1: ADD SCHEMA REPLACEMENT INSTRUCTION COMMENT
// =============================================================================

/**
 * Generates the comment block with instructions for replacing the hardcoded schema name.
 */
function buildSchemaReplacementComment(info: ConfigInfo): string {
  return `// =============================================================================
// TODO: Replace the hardcoded schema name below with the config-based value:
//
//   import { ${info.configObjectName} } from "../config/config.ts";
//   export const schema = pgSchema(${info.configObjectName}.${info.configPropertyName});
//
// Environment variable: ${info.envVarName}
//
// DELETE THIS COMMENT BLOCK after making the replacement.
// =============================================================================`;
}

/**
 * TRANSFORMATION 1: Add schema replacement instruction comment
 *
 * Inserts a comment block before the pgSchema declaration with instructions
 * for replacing the hardcoded schema name with a config-based value.
 */
function transformAddSchemaReplacementComment(
  content: string,
  info: ConfigInfo,
): string {
  // Skip if comment already exists
  if (content.includes("TODO: Replace the hardcoded schema name")) {
    console.log("  [1] Schema replacement comment: already present, skipping.");
    return content;
  }

  // Find the pgSchema declaration
  const pgSchemaPattern = /^(export const [a-zA-Z]+ = pgSchema\("[^"]+"\);)$/m;
  const match = content.match(pgSchemaPattern);

  if (!match) {
    console.log("  [1] Schema replacement comment: no pgSchema found, skipping.");
    return content;
  }

  console.log("  [1] Schema replacement comment: added.");
  const comment = buildSchemaReplacementComment(info);
  return content.replace(pgSchemaPattern, `${comment}\n$1`);
}

// =============================================================================
// TRANSFORMATION 2: REPLACE UNKNOWN BYTEA COLUMNS (event-store only)
// =============================================================================

/**
 * TRANSFORMATION 2: Replace unknown() with eventStoreBytea()
 *
 * drizzle-kit generates `unknown("column")` for bytea columns because it
 * doesn't recognize the bytea type. This transformation replaces it with
 * our custom `eventStoreBytea("column")` type.
 *
 * Only applies to event-store packages.
 */
function transformReplaceUnknownByteaColumns(
  content: string,
  isEventStore: boolean,
): string {
  // Only apply to event-store packages
  if (!isEventStore) {
    return content;
  }

  // Skip if no unknown() calls exist
  if (!content.includes("unknown(")) {
    return content;
  }

  console.log("  [2] Replace bytea columns: unknown() → eventStoreBytea()");

  let result = content;

  // Add import for eventStoreBytea if not present
  if (!result.includes("eventStoreBytea")) {
    result = `import { eventStoreBytea } from "@knodia/db-event-store-config/utils";\n${result}`;
  }

  // Remove the TODO comments that drizzle-kit generates for bytea columns
  result = result.replace(
    /\s*\/\/ TODO: failed to parse database type 'bytea'\n/g,
    "\n",
  );

  // Replace unknown("column") with eventStoreBytea("column")
  result = result.replace(/unknown\(("[^"]+")\)/g, "eventStoreBytea($1)");

  return result;
}

// =============================================================================
// TRANSFORMATION 3: FIX TIMESTAMP MODE FROM STRING TO DATE
// =============================================================================

/**
 * TRANSFORMATION 3: Fix timestamp mode from 'string' to 'date'
 *
 * drizzle-kit generates `mode: 'string'` for timestamp columns, but we want
 * `mode: "date"` so that Drizzle returns proper Date objects instead of strings.
 */
function transformFixTimestampMode(content: string): string {
  // Skip if no string mode timestamps exist
  if (!content.includes("mode: 'string'")) {
    return content;
  }

  console.log("  [3] Fix timestamp mode: 'string' → \"date\"");

  // Replace mode: 'string' with mode: "date" in timestamp declarations
  return content.replace(
    /timestamp\(([^)]+),\s*\{([^}]*?)mode:\s*'string'([^}]*?)\}\)/g,
    'timestamp($1, {$2mode: "date"$3})',
  );
}

// =============================================================================
// TRANSFORMATION 4: GENERATE TYPE EXPORTS FOR ALL TABLES
// =============================================================================

/**
 * TRANSFORMATION 4: Generate TypeScript type exports for all tables
 *
 * Creates type exports using Drizzle's $inferSelect and $inferInsert
 * for each table defined in the schema.
 *
 * Example output:
 *   export type EserviceInLocalEservice = typeof eserviceInLocalEservice.$inferSelect;
 *   export type NewEserviceInLocalEservice = typeof eserviceInLocalEservice.$inferInsert;
 */
function transformGenerateTypeExports(content: string): string {
  // Find all table definitions: export const tableName = schema.table(
  const tableDefinitionPattern = /export const (\w+)\s*=\s*\w+\.table\(/g;
  const tableMatches = content.matchAll(tableDefinitionPattern);

  const tableNames: string[] = [];
  for (const match of tableMatches) {
    tableNames.push(match[1]);
  }

  // Skip if no tables found
  if (tableNames.length === 0) {
    return content;
  }

  // Skip if type exports already exist
  if (content.includes("$inferSelect") || content.includes("$inferInsert")) {
    console.log("  [4] Type exports: already present, skipping.");
    return content;
  }

  console.log(`  [4] Type exports: generating for ${tableNames.length} table(s)`);

  // Build type exports section
  const typeExportsLines: string[] = [
    "",
    "// =============================================================================",
    "// Type exports (auto-generated)",
    "// =============================================================================",
  ];

  for (const tableName of tableNames) {
    // Convert to PascalCase: eserviceInLocalEservice → EserviceInLocalEservice
    const typeName = tableName.charAt(0).toUpperCase() + tableName.slice(1);

    typeExportsLines.push(
      `export type ${typeName} = typeof ${tableName}.$inferSelect;`,
    );
    typeExportsLines.push(
      `export type New${typeName} = typeof ${tableName}.$inferInsert;`,
    );
  }

  return content + typeExportsLines.join("\n") + "\n";
}

// =============================================================================
// TRANSFORMATION 5: DEDUPLICATE RELATION PROPERTIES (relations.ts)
// =============================================================================

/**
 * TRANSFORMATION 5: Deduplicate relation properties
 *
 * drizzle-kit generates duplicate property keys in relations() object literals
 * when a table has multiple FKs referencing the same table from the same column
 * (e.g., a direct FK with CASCADE and a composite FK with metadata_version).
 *
 * This transformation removes the second occurrence of each duplicate property,
 * keeping only the first.
 */
function transformDeduplicateRelationProperties(content: string): string {
  const lines = content.split("\n");
  const result: string[] = [];
  const seenKeys = new Set<string>();
  let insideRelations = false;
  let skipping = false;
  let braceDepth = 0;

  // Regex to match property keys like: `  propertyName: one(` or `  propertyName: many(`
  const propertyKeyPattern = /^[\t ]+(\w+):\s*(?:one|many)\(/;

  for (const line of lines) {
    // Track entering a relations() block — reset seen keys
    if (line.includes("=> ({")) {
      insideRelations = true;
      seenKeys.clear();
    }

    // Track exiting a relations() block
    if (insideRelations && line.includes("}));")) {
      insideRelations = false;
    }

    if (insideRelations && !skipping) {
      const match = line.match(propertyKeyPattern);
      if (match) {
        const key = match[1];
        if (seenKeys.has(key)) {
          // Duplicate found — start skipping
          skipping = true;
          braceDepth = 0;
          // Count opening braces on this line
          for (const ch of line) {
            if (ch === "{") braceDepth++;
            if (ch === "}") braceDepth--;
          }
          if (braceDepth <= 0) skipping = false; // single-line property
          continue;
        }
        seenKeys.add(key);
      }
    }

    if (skipping) {
      for (const ch of line) {
        if (ch === "{") braceDepth++;
        if (ch === "}") braceDepth--;
      }
      if (braceDepth <= 0) skipping = false;
      continue;
    }

    result.push(line);
  }

  return result.join("\n");
}

// =============================================================================
// MAIN PROCESSING
// =============================================================================

/**
 * Applies all transformations to the schema file and overwrites it in place.
 */
function processSchemaFile(schemaFilePath: string, info: ConfigInfo): void {
  const absolutePath = resolve(cwd(), schemaFilePath);

  // Read the schema file
  let content: string = "";
  try {
    content = readFileSync(absolutePath, "utf-8");
  } catch {
    console.error(`Error: Schema file not found: ${absolutePath}`);
    exit(1);
  }

  // Apply all transformations in order
  content = transformAddSchemaReplacementComment(content, info);
  content = transformReplaceUnknownByteaColumns(content, info.isEventStore);
  content = transformFixTimestampMode(content);
  content = transformGenerateTypeExports(content);

  // Overwrite the input file with transformed content
  writeFileSync(absolutePath, content, "utf-8");

  // Print summary
  console.log("\n" + "=".repeat(80));
  console.log("SCHEMA PROCESSED SUCCESSFULLY");
  console.log("=".repeat(80));
  console.log(`\nOutput: ${schemaFilePath}`);
  console.log(`\nConfig detected:`);
  console.log(`  Env var: ${info.envVarName}`);
  console.log(`  Config:  ${info.configObjectName}.${info.configPropertyName}`);
  console.log(`  Type:    ${info.isEventStore ? "event-store" : "readmodel"}`);
  console.log("\n" + "-".repeat(80));
  console.log("NEXT STEPS:");
  console.log("-".repeat(80));
  console.log(`\n1. Copy the content of ${schemaFilePath} to src/eservice.ts`);
  console.log(`\n2. Replace the hardcoded schema name with the config import`);
  console.log(`   (follow the TODO comment in the file)`);
  console.log(`\n3. Delete the TODO comment block`);
  console.log("\n" + "=".repeat(80));
}

/**
 * Applies transformation 5 to the relations file and overwrites it in place.
 */
function processRelationsFile(relationsFilePath: string): void {
  const absolutePath = resolve(cwd(), relationsFilePath);

  if (!existsSync(absolutePath)) {
    console.log(`\nRelations file not found: ${relationsFilePath} — skipping.`);
    return;
  }

  let content: string;
  try {
    content = readFileSync(absolutePath, "utf-8");
  } catch {
    console.log(
      `\nCould not read relations file: ${relationsFilePath} — skipping.`,
    );
    return;
  }

  const original = content;
  content = transformDeduplicateRelationProperties(content);

  if (content !== original) {
    writeFileSync(absolutePath, content, "utf-8");
    console.log(`\n  [5] Relations deduplicated: ${relationsFilePath}`);
  } else {
    console.log(
      `\n  [5] Relations: no duplicates found in ${relationsFilePath}`,
    );
  }
}

// =============================================================================
// ENTRY POINT
// =============================================================================

const DEFAULT_SCHEMA_PATH = "generated/schema.ts";

const args = argv.slice(2);
const schemaFilePath = args[0] ?? DEFAULT_SCHEMA_PATH;

console.log(`Processing ${schemaFilePath}...\n`);

const configInfo = parseConfigFile();
console.log(`Config detected: ${configInfo.envVarName}\n`);

processSchemaFile(schemaFilePath, configInfo);

const relationsFilePath = schemaFilePath.replace("schema.ts", "relations.ts");
processRelationsFile(relationsFilePath);
