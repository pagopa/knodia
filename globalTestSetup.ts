import { setupDynamoDBTestContainer } from "./packages/test-commons/src/testcontainers/dynamodb"
import { eventstoreTemplate } from "./packages/test-commons/src/eventstore"
import { readmodelTemplate } from "./packages/test-commons/src/readmodel"
import { remoteResourceDbTemplate } from "./packages/test-commons/src/remoteResourceDb"
import { signalHubDbTemplate } from "./packages/test-commons/src/signalHubDb"
import { signupDbTemplate } from "./packages/test-commons/src/signupDb"
import { setupKafkaTestContainer } from "./packages/test-commons/src/testcontainers/kafka"
import { setupMinioTestContainer } from "./packages/test-commons/src/testcontainers/minio"
import { createTestInfraNetwork } from "./packages/test-commons/src/testcontainers/network"
import { runTestFlywayMigrations, setupPostgresTestContainer } from "./packages/test-commons/src/testcontainers/postgres"
import type { TestProject } from 'vitest/node'

export default async function setup(project: TestProject) {
  const network = await createTestInfraNetwork();

  const [
    { container: postgresContainer, connectionString: postgresConnectionString },
    { container: kafkaContainer, broker },
    { container: minioContainer, connectionString: minioConnectionString },
    { container: dynamoDBContainer, endpoint: dynamoDBEndpoint },
  ] = await Promise.all([
    setupPostgresTestContainer(network),
    setupKafkaTestContainer(),
    setupMinioTestContainer(),
    setupDynamoDBTestContainer(network),
  ]);

  // Single Flyway container: creates roles + migrates all template databases
  await runTestFlywayMigrations({
    connectionString: postgresConnectionString,
    network,
    templates: [eventstoreTemplate, readmodelTemplate, remoteResourceDbTemplate, signalHubDbTemplate, signupDbTemplate],
  });

  project.provide("POSTGRES_CONNECTION_STRING", postgresConnectionString);
  project.provide("KAFKA_BROKER", broker);
  project.provide("MINIO_CONNECTION_STRING", minioConnectionString);
  project.provide("DYNAMODB_CONNECTION_STRING", dynamoDBEndpoint);

  return async function teardown() {
    await Promise.all([
      postgresContainer.stop({ removeVolumes: true }),
      kafkaContainer.stop({ removeVolumes: true }),
      minioContainer.stop({ removeVolumes: true }),
      dynamoDBContainer.stop({ removeVolumes: true }),
    ]);
    await network.stop();
  };
}
