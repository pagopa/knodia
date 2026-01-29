import { setupReadmodelTestContainer } from "./packages/test-commons/src/readmodel"
import type { TestProject } from 'vitest/node'

export default async function setup(project: TestProject) {    
  const { container, connectionString } = await setupReadmodelTestContainer();  

  project.provide("READMODEL_CONNECTION_STRING", connectionString);

  return async function teardown() {
    await container.stop({ removeVolumes: true })
  }
}