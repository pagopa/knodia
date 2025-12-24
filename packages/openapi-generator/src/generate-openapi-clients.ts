import { execSync } from "node:child_process";
import { glob } from "glob";
import path from "node:path";
import { mkdirSync } from "node:fs";

const ROOT = "../.."

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
        // apps/services/*-process/openapi/openapi.yaml
        const serviceName = openapiFile.split(path.sep)[2];

        const packageName =
            serviceName.replace(PROCESS_SUFFIX, MODELS_SUFFIX);

        const outputDir = path.join(
            "packages",
            packageName,
            "src",
            "generated/client"
        );

        mkdirSync(outputDir, { recursive: true });

        const cmd = [
            "pnpm exec openapi-generator-cli generate",
            "-g typescript-fetch",
            `-i ${openapiFile}`,
            `-o ${outputDir}`
        ].join(" ");

        console.log(`\n▶ Generating ${packageName}`);
        execSync(cmd, {
            cwd: ROOT,
            stdio: "inherit",
        });
    }
}

main()
