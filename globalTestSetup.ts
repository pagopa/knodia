import { setupReadmodelTestContainer } from "./packages/test-commons/src/readmodel"
import { setupEventstoreTestContainer } from "./packages/test-commons/src/eventstore"
import { setupKafkaTestContainer } from "./packages/test-commons/src/testcontainers/kafka"
import { setupMinioTestContainer } from "./packages/test-commons/src/testcontainers/minio"
import type { TestProject } from 'vitest/node'

export default async function setup(project: TestProject) {
  const [
    { container: readmodelContainer, connectionString: readmodelConnectionString },
    { container: eventstoreContainer, connectionString: eventstoreConnectionString },
    { container: kafkaContainer, broker },
    { container: minioContainer, connectionString: minioConnectionString },
  ] = await Promise.all([
    setupReadmodelTestContainer(),
    setupEventstoreTestContainer(),
    setupKafkaTestContainer(),
    setupMinioTestContainer()
  ]);

  project.provide("READMODEL_CONNECTION_STRING", readmodelConnectionString);
  project.provide("EVENTSTORE_CONNECTION_STRING", eventstoreConnectionString);
  project.provide("KAFKA_BROKER", broker);
  project.provide("MINIO_CONNECTION_STRING", minioConnectionString);

  return async function teardown() {
    await Promise.all([
      readmodelContainer.stop({ removeVolumes: true }),
      eventstoreContainer.stop({ removeVolumes: true }),
      kafkaContainer.stop({ removeVolumes: true }),
      minioContainer.stop({ removeVolumes: true }),
    ]);
  };
}
