import { createClient } from "@hey-api/openapi-ts";
import { glob } from "glob";
import { mkdirSync } from "node:fs";
import path from "node:path";

const ROOT = "../../";

const PROCESS_SUFFIX = "-process";
const MODELS_SUFFIX = "-models";

export function createProcessClient({
  openapiPath,
  tsConfigPath,
}: {
  openapiPath?: string;
  tsConfigPath: string;
}): void {
  const currentPath = process.cwd();
  const currentDir = currentPath.split(path.sep).at(-1);

  // Path example: apps/services/*-process/openapi/openapi.yaml
  const serviceName = openapiPath?.split(path.sep)[2];
  const entity =
    serviceName?.replace(PROCESS_SUFFIX, "") ??
    currentDir?.replace(MODELS_SUFFIX, "");

  if (!entity) {
    throw new Error(
      `Cannot determine entity name for API client generation. Checking path: ${currentPath}`,
    );
  }

  const outputPath = path.join(
    ROOT,
    "packages",
    `${entity}${MODELS_SUFFIX}`,
    "src",
    "generated",
  );

  mkdirSync(outputPath, { recursive: true });

  createClient({
    input: openapiPath
      ? path.join(ROOT, openapiPath)
      : path.join(
          ROOT,
          "apps",
          "services",
          `${entity}${PROCESS_SUFFIX}`,
          "openapi",
          "openapi.yaml",
        ),
    output: {
      fileName: {
        suffix: `.${entity}.gen`,
      },
      format: "prettier",
      importFileExtension: ".ts",
      lint: "eslint",
      path: outputPath,
      tsConfigPath: tsConfigPath,
    },
    plugins: [
      {
        name: "@hey-api/client-fetch",
      },
      "@hey-api/sdk",
    ],
  });
}

async function main(): Promise<void> {
  const openapiPaths = await glob(
    "apps/services/*-process/openapi/openapi.yaml",
    { cwd: ROOT },
  );

  if (openapiPaths.length === 0) {
    console.warn("No OpenAPI specs found");
    return;
  }

  for (const openapiPath of openapiPaths) {
    createProcessClient({
      openapiPath: openapiPath,
      tsConfigPath: "./tsconfig.json",
    });
  }
}

main();
