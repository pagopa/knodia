import { config } from "./base.js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

export default [
  ...config,
  { ignores: ["dist/**"] },
  reactHooks.configs.flat.recommended,
  reactRefresh.configs.vite,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
  },
];
