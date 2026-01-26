import config from "@knodia/eslint-config/react";
import storybook from "eslint-plugin-storybook";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  ...config,
  ...storybook.configs["flat/recommended"],
  globalIgnores(["dist"]),
  /**
   * This rule is disabled because it causes problems with sorting
   * object properties in the tailwind-variants function. The ordering
   * of properties is important for the correct application of styles,
   * and automatic sorting can lead to unintended styling issues.
   */
  { rules: { "perfectionist/sort-objects": "off" } },
]);
