import config from "./eslint.node.js";

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
