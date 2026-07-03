import { createClient, type UserConfig } from "@hey-api/openapi-ts";
import { createRequire } from "node:module";

// hey-api no longer bundles prettier (`output.format` was removed in favor of
// `postProcess`, which spawns the binary from PATH) — resolve it from this
// package's dependencies so client packages don't each need to install it
const prettierBin = createRequire(import.meta.url).resolve(
  "prettier/bin/prettier.cjs",
);

export function generateApiClient(
  openapiPath: string,
  customPlugins: UserConfig["plugins"] = [],
): void {
  createClient({
    input: openapiPath,
    output: {
      importFileExtension: ".ts",
      path: "./src/generated",
      postProcess: [
        {
          args: [prettierBin, "--write", "{{path}}"],
          command: "node",
          name: "prettier",
        },
      ],
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
