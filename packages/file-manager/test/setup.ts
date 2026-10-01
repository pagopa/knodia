import { setupRustfsTestBucket } from "@knodia/test-commons/rustfs";
import { afterAll, afterEach, beforeAll, inject } from "vitest";

import { type FileManager, initFileManager } from "../src/fileManager.ts";

export let testBucket: string;
export let fileManager: FileManager;
let cleanAfterEach: () => Promise<void>;
let cleanupAfterAll: () => Promise<void>;

beforeAll(async () => {
  const setup = await setupRustfsTestBucket(inject("RUSTFS_CONNECTION_STRING"));
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
