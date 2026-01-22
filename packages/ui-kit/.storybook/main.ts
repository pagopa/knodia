import type { StorybookConfig } from "@storybook/react-vite";

import { dirname } from "path";
import { fileURLToPath } from "url";

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
function getAbsolutePath(value: string): string {
  return dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)));
}

const config: StorybookConfig = {
  addons: [],
  framework: getAbsolutePath("@storybook/react-vite"),
  stories: ["../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  typescript: {
    reactDocgen: "react-docgen-typescript",
    reactDocgenTypescriptOptions: {
      compilerOptions: {
        allowSyntheticDefaultImports: false,
        esModuleInterop: false,
      },
      propFilter: (prop) => !/^aria-|on[A-Z]/.test(prop.name),
      shouldExtractLiteralValuesFromEnum: true,
    },
  },
};
export default config;
