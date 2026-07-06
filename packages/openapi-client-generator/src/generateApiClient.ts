import { createClient, type UserConfig } from "@hey-api/openapi-ts";

export function generateApiClient(
  openapiPath: string,
  customPlugins: UserConfig["plugins"] = [],
): void {
  createClient({
    input: openapiPath,
    output: {
      importFileExtension: ".ts",
      path: "./src/generated",
      tsConfigPath: "./tsconfig.json",
    },
    plugins: [
      {
        name: "@hey-api/client-axios",
        throwOnError: true,
      },
      "@hey-api/sdk",
      ...customPlugins,
    ],
  });
}
