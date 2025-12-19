import { writeFile } from "node:fs/promises";
import type { FastifyInstance } from "fastify";

export default async function generateOpenapi(
  app: FastifyInstance
): Promise<void> {
  await app.ready();

  if (!app.swagger) {
    throw new Error("@fastify/swagger plugin is not loaded");
  }

  const schema = app.swagger({ yaml: true });

  await writeFile("openapi/openapi.yaml", schema, { flag: "w" });

  await app.close();
}
