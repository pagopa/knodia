import { createClient } from "@hey-api/openapi-ts";

export function createProcessClient(openapiPath: string, entity: string): void {
  createClient({
    input: openapiPath,
    output: {
      fileName: {
        suffix: `.${entity}.gen`,
      },
      format: "prettier",
      importFileExtension: ".ts",
      lint: "eslint",
      path: "./src/generated",
      tsConfigPath: "./tsconfig.json",
    },
    plugins: [
      {
        name: "@hey-api/client-fetch",
      },
      "@hey-api/sdk",
    ],
  });
}
