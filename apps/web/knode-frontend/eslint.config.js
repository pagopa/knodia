import config from "@knodia/eslint-config/react";
import globals from "globals";

export default [
  ...config,
  {
    files: ["public/**/*.js"],
    languageOptions: {
      globals: globals.browser,
      sourceType: "script",
    },
  },
];
