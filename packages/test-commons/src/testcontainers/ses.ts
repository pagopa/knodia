import { SESv2Client } from "@aws-sdk/client-sesv2";
import { GenericContainer, Wait } from "testcontainers";

const SES_PORT = 8005;
// aws-ses-v2-local has no published image; run it on a Node image (digest
// pinned to docker/compose.yaml so dev and CI share the build).
const SES_IMAGE =
  "node:24-alpine@sha256:4f696fbf39f383c1e486030ba6b289a5d9af541642fc78ab197e584a113b9c03";
const SES_LOCAL_VERSION = "2.9.0";

const SES_REGION = "eu-south-1";
const SES_ACCESS_KEY_ID = "testawskey";
const SES_SECRET_ACCESS_KEY = "testawssecret";

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

/**
 * !!! Intended to be called once in global test setup !!!
 *
 * Starts the shared aws-ses-v2-local container (SESv2-compatible API). Returns
 * the connection string for test SES clients and the container to stop in the
 * global teardown.
 */
export async function setupSesTestContainer() {
  const container = await new GenericContainer(SES_IMAGE)
    .withName("knodia-ses-test-container")
    .withLabels({ "com.docker.compose.project": "knodia-test" })
    .withExposedPorts(SES_PORT)
    .withEntrypoint(["/bin/sh", "-c"])
    .withCommand([
      `npm install -g aws-ses-v2-local@${SES_LOCAL_VERSION} && aws-ses-v2-local --port=${SES_PORT} --host=0.0.0.0`,
    ])
    // The global install delays the listen, so wait on the store API responding.
    .withWaitStrategy(Wait.forHttp("/store", SES_PORT).forStatusCode(200))
    .withStartupTimeout(180_000)
    .withReuse()
    .start();

  const mappedPort = container.getMappedPort(SES_PORT);
  const connectionString = `http://${container.getHost()}:${mappedPort}`;

  return { connectionString, container };
}

/**
 * Builds an SES client + store helpers bound to the shared mock for a single
 * test file. Intended to be called in beforeAll of each test setup.
 */
export function setupSesTestStore(connectionString: string) {
  return {
    cleanAfterEach: () => clearStore(connectionString),
    getSentEmails: () => getStore(connectionString),
    sesClient: createTestSesClient(connectionString),
  };
}

async function clearStore(connectionString: string): Promise<void> {
  const response = await fetch(`${connectionString}/clear-store`, {
    method: "POST",
  });
  if (!response.ok) {
    throw new Error(`Failed to clear SES mock store: ${response.status}`);
  }
}

function createTestSesClient(connectionString: string): SESv2Client {
  return new SESv2Client({
    credentials: {
      accessKeyId: SES_ACCESS_KEY_ID,
      secretAccessKey: SES_SECRET_ACCESS_KEY,
    },
    endpoint: connectionString,
    region: SES_REGION,
  });
}

// Returns received emails in insertion order (oldest first).
async function getStore(connectionString: string): Promise<SesStoredEmail[]> {
  const response = await fetch(`${connectionString}/store`);
  if (!response.ok) {
    throw new Error(`Failed to read SES mock store: ${response.status}`);
  }
  const data = (await response.json()) as { emails: SesStoredEmail[] };
  return data.emails;
}

declare module "vitest" {
  export interface ProvidedContext {
    SES_CONNECTION_STRING: string;
  }
}
