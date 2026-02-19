import { setupEventstoreTemplate } from "./packages/test-commons/src/eventstore"
import { setupReadmodelTemplate } from "./packages/test-commons/src/readmodel"
import { setupKafkaTestContainer } from "./packages/test-commons/src/testcontainers/kafka"
import { setupMinioTestContainer } from "./packages/test-commons/src/testcontainers/minio"
import { startPostgresTestContainer } from "./packages/test-commons/src/testcontainers/postgres"
import type { TestProject } from 'vitest/node'

export default async function setup(project: TestProject) {
  const [
    { container: postgresContainer, connectionString: postgresConnectionString },
    { container: kafkaContainer, broker },
    { container: minioContainer, connectionString: minioConnectionString },
  ] = await Promise.all([
    startPostgresTestContainer(),
    setupKafkaTestContainer(),
    setupMinioTestContainer()
  ]);

  await Promise.all([
    setupEventstoreTemplate(postgresConnectionString),
    setupReadmodelTemplate(postgresConnectionString),
  ]);

  project.provide("POSTGRES_CONNECTION_STRING", postgresConnectionString);
  project.provide("KAFKA_BROKER", broker);
  project.provide("MINIO_CONNECTION_STRING", minioConnectionString);

  return async function teardown() {
    await Promise.all([
      postgresContainer.stop({ removeVolumes: true }),
      kafkaContainer.stop({ removeVolumes: true }),
      minioContainer.stop({ removeVolumes: true }),
    ]);
  };
}
