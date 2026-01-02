import { createClient } from "@hey-api/openapi-ts";
import { glob } from "glob";
import { mkdirSync } from "node:fs";
import path from "node:path";

const ROOT = "../../";

const PROCESS_SUFFIX = "-process";
const MODELS_SUFFIX = "-models";

async function main(): Promise<void> {
  const openapiFiles = await glob(
    "apps/services/*-process/openapi/openapi.yaml",
    { cwd: ROOT },
  );

  if (openapiFiles.length === 0) {
    console.warn("No OpenAPI specs found");
    return;
  }

  for (const openapiFile of openapiFiles) {
    // Path example: apps/services/*-process/openapi/openapi.yaml
    const serviceName = openapiFile.split(path.sep)[2];

    if (!serviceName) {
      throw new Error(`Unexpected service name: ${serviceName}`);
    }

    const packageName = serviceName.replace(PROCESS_SUFFIX, MODELS_SUFFIX);

    const outputDir = path.join("packages", packageName, "src", "generated");

    mkdirSync(outputDir, { recursive: true });

    createClient({
      input: ROOT + openapiFile,
      output: {
        fileName: {
          suffix: `.${serviceName.replace(PROCESS_SUFFIX, "")}.gen`,
        },
        format: "prettier",
        importFileExtension: ".ts",
        lint: "eslint",
        path: ROOT + outputDir,
        tsConfigPath: `./tsconfig.json`,
      },
      plugins: ["@hey-api/client-fetch", "@hey-api/sdk"],
    });
  }
}

main();
