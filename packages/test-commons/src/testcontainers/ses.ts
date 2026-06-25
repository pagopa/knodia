import { SESv2Client } from "@aws-sdk/client-sesv2";
import { GenericContainer, Wait } from "testcontainers";

const SES_PORT = 8005;
// aws-ses-v2-local has no published image, so we run it via a Node image and
// install it at startup — the same approach used by PDND/interop.
const SES_NODE_IMAGE = "node:24-alpine";
const SES_LOCAL_VERSION = "2.9.0";

const SES_TEST_REGION = "eu-south-1";
const SES_TEST_ACCESS_KEY_ID = "testawskey";
const SES_TEST_SECRET_ACCESS_KEY = "testawssecret";

interface SesStoredEmail {
  attachments: {
    content?: string;
    contentType: string;
    filename: string;
  }[];
  body: { html?: string; text?: string };
  destination: { to: string[] };
  from: string;
  subject: string;
}

/** Empties the mock store; call between tests. */
export async function clearSesStore(connectionString: string): Promise<void> {
  const response = await fetch(`${connectionString}/clear-store`, {
    method: "POST",
  });
  if (!response.ok) {
    throw new Error(`Failed to clear SES mock store: ${response.status}`);
  }
}

export function createTestSesClient(connectionString: string): SESv2Client {
  return new SESv2Client({
    credentials: {
      accessKeyId: SES_TEST_ACCESS_KEY_ID,
      secretAccessKey: SES_TEST_SECRET_ACCESS_KEY,
    },
    endpoint: connectionString,
    region: SES_TEST_REGION,
  });
}

/** Reads the emails received by the mock (most recent first). */
export async function getSentEmails(
  connectionString: string,
): Promise<SesStoredEmail[]> {
  const response = await fetch(`${connectionString}/store`);
  if (!response.ok) {
    throw new Error(`Failed to read SES mock store: ${response.status}`);
  }
  const data = (await response.json()) as { emails: SesStoredEmail[] };
  return data.emails;
}

/**
 * !!! Intended to be called once in global test setup !!!
 *
 * Starts a container exposing an AWS SESv2-compatible API (aws-ses-v2-local).
 * Returns the connection string to be used by test SES clients and the
 * container instance to be stopped in the global test teardown.
 */
export async function setupSesTestContainer() {
  const container = await new GenericContainer(SES_NODE_IMAGE)
    .withName("knodia-ses-test-container")
    .withLabels({ "com.docker.compose.project": "knodia-test" })
    .withExposedPorts(SES_PORT)
    .withEntrypoint(["/bin/sh", "-c"])
    .withCommand([
      `npm install -g aws-ses-v2-local@${SES_LOCAL_VERSION} && aws-ses-v2-local --port=${SES_PORT} --host=0.0.0.0`,
    ])
    // npm install -g runs before the server listens, so wait on the store API
    // rather than the raw port; give it room for the install.
    .withWaitStrategy(Wait.forHttp("/store", SES_PORT).forStatusCode(200))
    .withStartupTimeout(180_000)
    .withReuse()
    .start();

  const mappedPort = container.getMappedPort(SES_PORT);
  const host = container.getHost();
  const connectionString = `http://${host}:${mappedPort}`;

  return { connectionString, container };
}

declare module "vitest" {
  export interface ProvidedContext {
    SES_CONNECTION_STRING: string;
  }
}
