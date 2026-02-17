import {
  createTestBucket,
  createTestS3Client,
  deleteAllObjectsInBucket,
  deleteTestBucket,
} from "@knodia/test-commons/minio";
import { afterEach } from "vitest";
import { afterAll, beforeAll, inject } from "vitest";

import { type FileManager, initFileManager } from "../src/fileManager.ts";

export const TEST_BUCKET = "test-bucket";
export let fileManager: FileManager;

let s3Client: ReturnType<typeof createTestS3Client>;

beforeAll(async () => {
  s3Client = createTestS3Client(inject("MINIO_CONNECTION_STRING"));
  await createTestBucket(s3Client, TEST_BUCKET);
  fileManager = initFileManager(s3Client);
});

afterEach(async () => {
  await deleteAllObjectsInBucket(s3Client, TEST_BUCKET);
});

afterAll(async () => {
  await deleteTestBucket(s3Client, TEST_BUCKET);
});
