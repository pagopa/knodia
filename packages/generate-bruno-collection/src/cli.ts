#!/usr/bin/env node

import * as path from "node:path";

import { generateBruFile } from "./generateBrunoCollection.ts";

const args = process.argv.slice(2);

function printUsage(): void {
  console.log(`
Usage: generate-bruno-collection <openapi-file> --method <METHOD> --path <PATH>

Arguments:
  openapi-file   Path to the OpenAPI file (YAML)

Options:
  --method <METHOD>   HTTP method (GET, POST, PUT, DELETE, PATCH)
  --path <PATH>       API endpoint path (e.g., /eservices)

Examples:
  pnpm -w generate-bruno-collection apps/services/eservice-process/openapi/openapi.yaml --method GET --path /eservices
  pnpm -w generate-bruno-collection apps/services/eservice-process/openapi/openapi.yaml --method POST --path /eservices
  pnpm -w generate-bruno-collection apps/services/backend-for-frontend/openapi/openapi.yaml --method GET --path /status
`);
}

if (args.length < 1 || args.includes("--help")) {
  printUsage();
  process.exit(args.includes("--help") ? 0 : 1);
}

const openapiFile = args[0] as string;

const methodIndex = args.indexOf("--method");
if (methodIndex === -1 || !args[methodIndex + 1]) {
  console.error("Error: --method is required");
  printUsage();
  process.exit(1);
}
const method = args[methodIndex + 1] as string;

const pathIndex = args.indexOf("--path");
if (pathIndex === -1 || !args[pathIndex + 1]) {
  console.error("Error: --path is required");
  printUsage();
  process.exit(1);
}
const endpointPath = args[pathIndex + 1] as string;

// Extract service name from the OpenAPI file path
// e.g., "apps/services/eservice-process/openapi/openapi.yaml" -> "eservice-process"
const serviceNameMatch = openapiFile.match(/apps\/services\/([^/]+)\/openapi/);
if (!serviceNameMatch?.[1]) {
  console.error(
    `Error: Could not extract service name from path: ${openapiFile}\nExpected format: apps/services/<service-name>/openapi/<file>`,
  );
  process.exit(1);
}
const serviceName = serviceNameMatch[1];

const hostVar = `host-${serviceName}`;
const outputDir = path.resolve(process.cwd(), "collections", serviceName);

try {
  const filePath = await generateBruFile({
    endpointPath,
    hostVar,
    method,
    openapiPath: openapiFile,
    outputDir,
  });
  console.log(`Bruno request generated: ${filePath}`);
} catch (error) {
  console.error(
    "Error:",
    error instanceof Error ? error.message : String(error),
  );
  process.exit(1);
}
