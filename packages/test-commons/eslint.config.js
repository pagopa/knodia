import config from "@knodia/eslint-config/node";

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
