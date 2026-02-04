import { createClient } from "@hey-api/openapi-ts";

export function generateApiClient(
  openapiPath: string,
  options?: { generateZodSchemas?: boolean },
): void {
  createClient({
    input: openapiPath,
    output: {
      format: "prettier",
      importFileExtension: ".ts",
      lint: "eslint",
      path: "./src/generated",
      tsConfigPath: "./tsconfig.json",
    },
    plugins: [
      {
        name: "@hey-api/client-axios",
      },
      "@hey-api/sdk",
      ...(options?.generateZodSchemas ? ["zod"] : []),
    ],
  });
}
