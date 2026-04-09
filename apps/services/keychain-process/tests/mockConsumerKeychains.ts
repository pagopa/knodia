import { getMockConsumerKeychain } from "@knodia/test-commons/utils";

export const mockConsumerKeychains = Array.from({ length: 10 }, (_, index) =>
  getMockConsumerKeychain(index),
);
