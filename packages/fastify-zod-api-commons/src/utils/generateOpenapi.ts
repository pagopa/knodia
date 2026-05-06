import type { FastifyInstance } from "fastify";

import { writeFile } from "node:fs/promises";

export default async function generateOpenapi(
  app: FastifyInstance,
  outputPath = "openapi/openapi.yaml",
): Promise<void> {
  await app.ready();

  if (!app.swagger) {
    throw new Error("@fastify/swagger plugin is not loaded");
  }

  const schema = app.swagger({ yaml: true });

  await writeFile(outputPath, schema, { flag: "w" });

  await app.close();
}
