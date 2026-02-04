import { setupReadmodelTestContainer } from "./packages/test-commons/src/readmodel"
import { setupEventstoreTestContainer } from "./packages/test-commons/src/eventstore"
import { setupKafkaTestContainer } from "./packages/test-commons/src/testcontainers/kafka"
import type { TestProject } from 'vitest/node'

export default async function setup(project: TestProject) {    
  const { container: readmodelContainer, connectionString: readmodelConnectionString } = await setupReadmodelTestContainer();  
  const { container: eventstoreContainer, connectionString: eventstoreConnectionString } = await setupEventstoreTestContainer();
  const {container: kafkaContainer, broker} = await setupKafkaTestContainer();

  project.provide("READMODEL_CONNECTION_STRING", readmodelConnectionString);
  project.provide("EVENTSTORE_CONNECTION_STRING", eventstoreConnectionString);
  project.provide("KAFKA_BROKER", broker);

  return async function teardown() {
    await readmodelContainer.stop({ removeVolumes: true })
    await eventstoreContainer.stop({ removeVolumes: true })
    await kafkaContainer.stop({ removeVolumes: true })
  }
}
