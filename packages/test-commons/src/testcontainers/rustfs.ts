import {
  CreateBucketCommand,
  DeleteBucketCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
  S3Client,
} from "@aws-sdk/client-s3";
import { GenericContainer, Wait } from "testcontainers";

const TEST_RUSTFS_PORT = 9000;
// Digest pinned to docker/compose.yaml so dev and CI share the image.
const TEST_RUSTFS_IMAGE =
  "rustfs/rustfs:1.0.0@sha256:8cc9801755448b71a786705ce76692c77e14936cccd87cf2fc31842e58f4d1ff";

const TEST_RUSTFS_ACCESS_KEY = "rustfs_testuser";
const TEST_RUSTFS_SECRET_KEY = "rustfs_testpassword";

/**
 * Creates a dedicated S3 bucket for a single test file by using the test container connection string.
 * It returns the S3 client, bucket name, and utility functions to
 * clean up the bucket after each test and to delete it after all tests.
 *
 * Intended to be called in beforeAll of each package test setup.
 */
export async function setupRustfsTestBucket(connectionString: string) {
  const bucket = `test-bucket-${crypto.randomUUID()}`;
  const s3Client = createTestS3Client(connectionString);

  await createTestBucket(s3Client, bucket);

  const cleanAfterEach = async () => deleteAllObjectsInBucket(s3Client, bucket);
  const cleanupAfterAll = async () => deleteTestBucket(s3Client, bucket);

  return { bucket, cleanAfterEach, cleanupAfterAll, s3Client };
}

/**
 * !!! Intended to be called once in global test setup !!!
 *
 *  Starts the shared RustFS (S3-compatible) test container.
 *  It returns the connection string to be used by test s3 clients and
 *  the container instance to be stopped in the global test teardown.
 */
export async function setupRustfsTestContainer() {
  const container = await new GenericContainer(TEST_RUSTFS_IMAGE)
    .withName("knodia-rustfs-test-container")
    .withLabels({ "com.docker.compose.project": "knodia-test" })
    .withExposedPorts(TEST_RUSTFS_PORT)
    .withEnvironment({
      RUSTFS_ACCESS_KEY: TEST_RUSTFS_ACCESS_KEY,
      RUSTFS_SECRET_KEY: TEST_RUSTFS_SECRET_KEY,
      RUSTFS_SERVER_DOMAINS: "localhost",
    })
    .withWaitStrategy(Wait.forHttp("/health", TEST_RUSTFS_PORT))
    .withReuse()
    .start();

  const mappedPort = container.getMappedPort(TEST_RUSTFS_PORT);
  const host = container.getHost();
  const connectionString = `http://${host}:${mappedPort}`;

  return { connectionString, container };
}

async function createTestBucket(
  client: S3Client,
  bucket: string,
): Promise<void> {
  await client.send(new CreateBucketCommand({ Bucket: bucket }));
}

function createTestS3Client(connectionString: string): S3Client {
  return new S3Client({
    credentials: {
      accessKeyId: TEST_RUSTFS_ACCESS_KEY,
      secretAccessKey: TEST_RUSTFS_SECRET_KEY,
    },
    endpoint: connectionString,
    region: "eu-south-1",
  });
}

async function deleteAllObjectsInBucket(
  client: S3Client,
  bucket: string,
): Promise<void> {
  const listed = await client.send(
    new ListObjectsV2Command({ Bucket: bucket }),
  );
  const objects =
    listed.Contents?.flatMap((o) => (o.Key ? [{ Key: o.Key }] : [])) ?? [];
  if (objects.length > 0) {
    await client.send(
      new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: { Objects: objects },
      }),
    );
  }
}

async function deleteTestBucket(
  client: S3Client,
  bucket: string,
): Promise<void> {
  await deleteAllObjectsInBucket(client, bucket);
  await client.send(new DeleteBucketCommand({ Bucket: bucket }));
}

declare module "vitest" {
  export interface ProvidedContext {
    RUSTFS_CONNECTION_STRING: string;
  }
}
