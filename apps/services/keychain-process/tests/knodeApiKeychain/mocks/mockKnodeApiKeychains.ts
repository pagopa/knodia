import { getMockKnodeApiKeychain } from "@knodia/test-commons/utils";

export const mockKnodeApiKeychains = Array.from({ length: 10 }, (_, index) =>
  getMockKnodeApiKeychain(index),
);
