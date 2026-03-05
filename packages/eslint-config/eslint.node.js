import { config } from "./base.js";

export const blockTestCommonsImports = {
  group: ["@knodia/test-commons/*"],
  message: "@knodia/test-commons imports are restricted",
};

export default [
  ...config,
  {
    files: ["**/src/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            blockTestCommonsImports,
            {
              group: ["@knodia/db-readmodel-*/writer"],
              message: `@knodia/db-readmodel-*/writer imports are restricted`,
            },
            {
              group: ["@knodia/fastify-zod-api-commons/authMock"],
              message: `@knodia/fastify-zod-api-commons/authMock imports are restricted`,
            }
          ],
        },
      ],
    },
  },
];
