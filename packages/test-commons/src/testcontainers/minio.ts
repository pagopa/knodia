import {
  CreateBucketCommand,
  DeleteBucketCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
  S3Client,
} from "@aws-sdk/client-s3";
import { MinioContainer } from "@testcontainers/minio";

const TEST_MINIO_PORT = 9000;
const TEST_MINIO_IMAGE = "minio/minio:RELEASE.2025-09-07T16-13-09Z";

const TEST_MINIO_USERNAME = "minio_testuser";
const TEST_MINIO_PASSWORD = "minio_testpassword";

export async function createTestBucket(
  client: S3Client,
  bucket: string,
): Promise<void> {
  await client.send(new CreateBucketCommand({ Bucket: bucket }));
}

export function createTestS3Client(connectionString: string): S3Client {
  return new S3Client({
    credentials: {
      accessKeyId: TEST_MINIO_USERNAME,
      secretAccessKey: TEST_MINIO_PASSWORD,
    },
    endpoint: connectionString,
    region: "eu-south-1",
  });
}

export async function deleteAllObjectsInBucket(
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

export async function deleteTestBucket(
  client: S3Client,
  bucket: string,
): Promise<void> {
  await deleteAllObjectsInBucket(client, bucket);
  await client.send(new DeleteBucketCommand({ Bucket: bucket }));
}

/**
 * !!! Intended to be called once in global test setup !!!
 *
 *  Starts the shared Minio test container.
 *  It returns the connection string to be used by test s3 clients and
 *  the container instance to be stopped in the global test teardown.
 */
export async function setupMinioTestContainer() {
  const container = await new MinioContainer(TEST_MINIO_IMAGE)
    .withUsername(TEST_MINIO_USERNAME)
    .withPassword(TEST_MINIO_PASSWORD)
    .withExposedPorts(TEST_MINIO_PORT)
    .withEnvironment({
      MINIO_DOMAIN: "localhost",
    })
    .withReuse()
    .start();

  const mappedPort = container.getMappedPort(TEST_MINIO_PORT);
  const host = container.getHost();
  const connectionString = `http://${host}:${mappedPort}`;

  return { connectionString, container };
}

declare module "vitest" {
  export interface ProvidedContext {
    MINIO_CONNECTION_STRING: string;
  }
}
