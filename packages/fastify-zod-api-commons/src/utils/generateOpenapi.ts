import type { FastifyInstance } from "fastify";

import { writeFile } from "node:fs/promises";

export default async function generateOpenapi(
  appOrPromise: FastifyInstance | Promise<FastifyInstance>,
  outputPath = "openapi/openapi.yaml",
): Promise<void> {
  const app = await appOrPromise;
  await app.ready();

  if (!app.swagger) {
    throw new Error("@fastify/swagger plugin is not loaded");
  }

  const schema = app.swagger({ yaml: true });

  await writeFile(outputPath, schema, { flag: "w" });

  await app.close();
}
