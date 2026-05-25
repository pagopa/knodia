import { createRequire } from "node:module";
import { defineProject } from "vitest/config";

const require = createRequire(import.meta.url);

export default defineProject({
  test: {
    setupFiles: [
      require.resolve("@knodia/fastify-zod-api-commons/authMock"),
      require.resolve("@knodia/fastify-zod-api-commons/redisMock"),
    ],
  },
});
