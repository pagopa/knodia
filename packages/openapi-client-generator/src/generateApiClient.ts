import { createClient, type UserConfig } from "@hey-api/openapi-ts";

export function generateApiClient(
  openapiPath: string,
  customPlugins: UserConfig["plugins"] = [],
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
      ...customPlugins,
    ],
  });
}
