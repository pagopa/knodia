import { fileURLToPath } from "node:url";
import { GenericContainer, type StartedNetwork, Wait } from "testcontainers";

const DYNAMODB_PORT = 8000;
const DYNAMODB_IMAGE = "amazon/dynamodb-local:3.3.0";
const DYNAMODB_NETWORK_ALIAS = "dynamodb-local";
const AWS_CLI_IMAGE = "amazon/aws-cli:2.34.25";

const DYNAMO_SCRIPTS_PATH = fileURLToPath(
  new URL(`../../../../scripts/dynamo`, import.meta.url),
);
const DYNAMO_TABLES_PATH = fileURLToPath(
  new URL(`../../../../dynamo-tables`, import.meta.url),
);

/**
 * !!! Intended to be called once in global test setup !!!
 *
 *  Starts the shared DynamoDB Local test container and runs the same
 *  setup script used by Docker Compose to create tables (and TTL configs)
 *  from the schemas in `dynamo-tables/`.
 */
export async function setupDynamoDBTestContainer(network: StartedNetwork) {
  const container = await new GenericContainer(DYNAMODB_IMAGE)
    .withNetwork(network)
    .withNetworkAliases(DYNAMODB_NETWORK_ALIAS)
    .withExposedPorts(DYNAMODB_PORT)
    .withCommand(["-jar", "DynamoDBLocal.jar", "-inMemory", "-sharedDb"])
    .withReuse()
    .start();

  await runDynamoDBTableSetup(network);

  const host = container.getHost();
  const mappedPort = container.getMappedPort(DYNAMODB_PORT);
  const endpoint = `http://${host}:${mappedPort}`;

  return { container, endpoint };
}

async function runDynamoDBTableSetup(network: StartedNetwork) {
  const setupContainer = await new GenericContainer(AWS_CLI_IMAGE)
    .withNetwork(network)
    .withBindMounts([
      {
        mode: "ro",
        source: DYNAMO_SCRIPTS_PATH,
        target: "/dynamo-scripts",
      },
      {
        mode: "ro",
        source: DYNAMO_TABLES_PATH,
        target: "/dynamo-tables",
      },
    ])
    .withEnvironment({
      AWS_ACCESS_KEY_ID: "test",
      AWS_DEFAULT_REGION: "eu-south-1",
      AWS_SECRET_ACCESS_KEY: "test",
      DYNAMODB_CONNECTION_STRING: `http://${DYNAMODB_NETWORK_ALIAS}:${DYNAMODB_PORT}`,
      TABLES_DIR: "/dynamo-tables",
    })
    .withEntrypoint(["/bin/bash", "/dynamo-scripts/setup-tables.sh"])
    .withWaitStrategy(Wait.forOneShotStartup())
    .start();

  await setupContainer.stop();
}

declare module "vitest" {
  export interface ProvidedContext {
    DYNAMODB_CONNECTION_STRING: string;
  }
}
