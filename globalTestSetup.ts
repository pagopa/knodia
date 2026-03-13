import { eventstoreTemplate } from "./packages/test-commons/src/eventstore"
import { readmodelTemplate } from "./packages/test-commons/src/readmodel"
import { remoteResourceDbTemplate } from "./packages/test-commons/src/remoteResourceDb"
import { setupKafkaTestContainer } from "./packages/test-commons/src/testcontainers/kafka"
import { setupMinioTestContainer } from "./packages/test-commons/src/testcontainers/minio"
import { runTestFlywayMigrations, setupPostgresTestContainer } from "./packages/test-commons/src/testcontainers/postgres"
import type { TestProject } from 'vitest/node'

export default async function setup(project: TestProject) {
  const [
    { container: postgresContainer, connectionString: postgresConnectionString, network },
    { container: kafkaContainer, broker },
    { container: minioContainer, connectionString: minioConnectionString },
  ] = await Promise.all([
    setupPostgresTestContainer(),
    setupKafkaTestContainer(),
    setupMinioTestContainer()
  ]);

  // Single Flyway container: creates roles + migrates all template databases
  await runTestFlywayMigrations({
    connectionString: postgresConnectionString,
    network,
    templates: [eventstoreTemplate, readmodelTemplate, remoteResourceDbTemplate],
  });

  project.provide("POSTGRES_CONNECTION_STRING", postgresConnectionString);
  project.provide("KAFKA_BROKER", broker);
  project.provide("MINIO_CONNECTION_STRING", minioConnectionString);

  return async function teardown() {
    await Promise.all([
      postgresContainer.stop({ removeVolumes: true }),
      kafkaContainer.stop({ removeVolumes: true }),
      minioContainer.stop({ removeVolumes: true }),
    ]);
    await network.stop();
  };
}
