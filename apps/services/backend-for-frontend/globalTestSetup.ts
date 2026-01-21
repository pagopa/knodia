import type { TestProject } from "vitest/node";

import { setupReadmodelTestDatabase } from "@knodia/test-commons/readmodel";

export async function setup(project: TestProject) {
  const readModelConnectionString = await setupReadmodelTestDatabase();
  project.provide("READMODEL_CONNECTION_STRING", readModelConnectionString);
}
