import { setupMinioTestBucket } from "@knodia/test-commons/minio";
import { afterAll, afterEach, beforeAll, inject } from "vitest";

import { type FileManager, initFileManager } from "../src/fileManager.ts";

export let testBucket: string;
export let fileManager: FileManager;
let cleanAfterEach: () => Promise<void>;
let cleanupAfterAll: () => Promise<void>;

beforeAll(async () => {
  const setup = await setupMinioTestBucket(inject("MINIO_CONNECTION_STRING"));
  testBucket = setup.bucket;
  cleanAfterEach = setup.cleanAfterEach;
  cleanupAfterAll = setup.cleanupAfterAll;
  fileManager = initFileManager(setup.s3Client);
});

afterEach(async () => {
  await cleanAfterEach();
});

afterAll(async () => {
  await cleanupAfterAll();
});
