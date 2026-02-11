import { setupReadmodelTestContainer } from "./packages/test-commons/src/readmodel"
import { setupEventstoreTestContainer } from "./packages/test-commons/src/eventstore"
import { setupKafkaTestContainer } from "./packages/test-commons/src/testcontainers/kafka"
import type { TestProject } from 'vitest/node'

export default async function setup(project: TestProject) {
  const [
    { container: readmodelContainer, connectionString: readmodelConnectionString },
    { container: eventstoreContainer, connectionString: eventstoreConnectionString },
    { container: kafkaContainer, broker },
  ] = await Promise.all([
    setupReadmodelTestContainer(),
    setupEventstoreTestContainer(),
    setupKafkaTestContainer(),
  ]);

  project.provide("READMODEL_CONNECTION_STRING", readmodelConnectionString);
  project.provide("EVENTSTORE_CONNECTION_STRING", eventstoreConnectionString);
  project.provide("KAFKA_BROKER", broker);

  return async function teardown() {
    await Promise.all([
      readmodelContainer.stop({ removeVolumes: true }),
      eventstoreContainer.stop({ removeVolumes: true }),
      kafkaContainer.stop({ removeVolumes: true }),
    ]);
  };
}
