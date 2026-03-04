import type { WithMetadata } from "@knodia/db-readmodel-commons/models";
import type { ConsumerKeychain } from "@knodia/keychain-models";

import {
  getMockConsumerKeychain,
  toExpectConsumerKeychain,
} from "@knodia/test-commons/utils";
import { describe, expect, it } from "vitest";

import {
  aggregateConsumerKeychain,
  aggregateConsumerKeychains,
} from "../src/converters/aggregators.ts";
import { splitConsumerKeychainIntoObjectsSQL } from "../src/converters/splitters.ts";
import { createConsumerKeychainAggregatorInput } from "./utils.ts";

describe("Consumer keychain aggregators", () => {
  it("should convert Consumer keychain SQL objects into a Consumer keychain business object", () => {
    const consumerKeychain: WithMetadata<ConsumerKeychain> = {
      data: getMockConsumerKeychain(),
      metadata: {
        version: 1,
      },
    };

    const consumerKeychainSQLObjects = splitConsumerKeychainIntoObjectsSQL(
      consumerKeychain.data,
      consumerKeychain.metadata.version,
    );

    const aggregatedConsumerKeychain = aggregateConsumerKeychain(
      createConsumerKeychainAggregatorInput(consumerKeychainSQLObjects),
    );

    expect(aggregatedConsumerKeychain).toEqual({
      data: toExpectConsumerKeychain(consumerKeychain.data),
      metadata: consumerKeychain.metadata,
    });
  });

  it("should convert Consumer keychain SQL objects into Consumer keychain business objects", () => {
    const consumerKeychain1: WithMetadata<ConsumerKeychain> = {
      data: getMockConsumerKeychain(),
      metadata: {
        version: 1,
      },
    };
    const consumerKeychain2: WithMetadata<ConsumerKeychain> = {
      data: getMockConsumerKeychain(1),
      metadata: {
        version: 1,
      },
    };

    const consumerKeychainSQLObjects1 = splitConsumerKeychainIntoObjectsSQL(
      consumerKeychain1.data,
      consumerKeychain1.metadata.version,
    );
    const consumerKeychainSQLObjects2 = splitConsumerKeychainIntoObjectsSQL(
      consumerKeychain2.data,
      consumerKeychain2.metadata.version,
    );

    const aggregatedConsumerKeychains = aggregateConsumerKeychains([
      ...createConsumerKeychainAggregatorInput(consumerKeychainSQLObjects1),
      ...createConsumerKeychainAggregatorInput(consumerKeychainSQLObjects2),
    ]);

    expect(aggregatedConsumerKeychains).toEqual(
      expect.arrayContaining([
        {
          data: toExpectConsumerKeychain(consumerKeychain1.data),
          metadata: consumerKeychain1.metadata,
        },
        {
          data: toExpectConsumerKeychain(consumerKeychain2.data),
          metadata: consumerKeychain2.metadata,
        },
      ]),
    );
  });
});
