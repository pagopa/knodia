import { createClient } from '@hey-api/openapi-ts';
import { glob } from "glob";
import path from "node:path";
import { mkdirSync } from "node:fs";

const ROOT = "../../"

const PROCESS_SUFFIX = "-process";
const MODELS_SUFFIX = "-models";

async function main(): Promise<void> {
    const openapiFiles = await glob(
        "apps/services/*-process/openapi/openapi.yaml",
        { cwd: ROOT }
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

        const packageName =
            serviceName.replace(PROCESS_SUFFIX, MODELS_SUFFIX);

        const outputDir = path.join(
            "packages",
            packageName,
            "src",
            "generated"
        );

        mkdirSync(outputDir, { recursive: true });

        createClient({
            input: ROOT + openapiFile,
            output: {
                format: "prettier",
                lint: "eslint",
                path: ROOT + outputDir,
                tsConfigPath: `./tsconfig.json`,
                importFileExtension: '.ts',
                fileName: {
                    suffix: "Catalog"
                }
            },
            plugins: [
                '@hey-api/client-fetch',
                // "zod",
                '@hey-api/sdk'
            ],
        });

    }
}

main()
