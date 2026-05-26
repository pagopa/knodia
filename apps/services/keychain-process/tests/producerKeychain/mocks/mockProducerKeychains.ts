import { getMockProducerKeychain } from "@knodia/test-commons/utils";

export const mockProducerKeychains = Array.from({ length: 10 }, (_, index) =>
  getMockProducerKeychain(index),
);
