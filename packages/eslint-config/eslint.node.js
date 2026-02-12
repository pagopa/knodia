import { config } from "./base.js";

export default [
  ...config,
  {
    files: ["**/src/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: ["@knodia/test-commons/*"],
        },
      ],
    },
  },
];
