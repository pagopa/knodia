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
      // spawns the prettier binary from PATH — provided by the workspace-root
      // devDependency, since hey-api no longer bundles prettier
      postProcess: ["prettier"],
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
