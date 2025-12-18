import { writeFile } from "node:fs/promises";
import app from "./src/app.ts";

await app.ready();

if (app.swagger === null || app.swagger === undefined) {
  throw new Error("@fastify/swagger plugin is not loaded");
}

const schema = app.swagger({ yaml: true });

await writeFile("openapi.yaml", schema, { flag: "w" });

await app.close();
