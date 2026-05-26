import type { WithMetadata } from "@knodia/db-readmodel-commons/models";

import { type ProducerKeychain } from "@knodia/keychain-models";
import {
  getMockProducerKeychain,
  toExpectProducerKeychain,
} from "@knodia/test-commons/utils";
import { describe, expect, it } from "vitest";

import {
  aggregateFlatProducerKeychain,
  aggregateFlatProducerKeychains,
  aggregateProducerKeychain,
  aggregateProducerKeychains,
} from "../src/converters/producerKeychainAggregators.ts";
import { splitProducerKeychainIntoObjectsSQL } from "../src/converters/producerKeychainSplitters.ts";
import {
  createProducerKeychainAggregatorInput,
  toFlatProducerKeychain,
} from "./producerKeychainUtils.ts";

describe("Producer keychain aggregators", () => {
  it("should convert Producer keychain SQL objects into a Producer keychain business object", () => {
    const producerKeychain: WithMetadata<ProducerKeychain> = {
      data: getMockProducerKeychain(),
      metadata: {
        version: 1,
      },
    };

    const producerKeychainSQLObjects = splitProducerKeychainIntoObjectsSQL(
      producerKeychain.data,
      producerKeychain.metadata.version,
    );

    const aggregatedProducerKeychain = aggregateProducerKeychain(
      createProducerKeychainAggregatorInput(producerKeychainSQLObjects),
    );

    expect(aggregatedProducerKeychain).toEqual({
      data: toExpectProducerKeychain(producerKeychain.data),
      metadata: producerKeychain.metadata,
    });
  });

  it("should convert Producer keychain SQL objects into Producer keychain business objects", () => {
    const producerKeychain1: WithMetadata<ProducerKeychain> = {
      data: getMockProducerKeychain(),
      metadata: {
        version: 1,
      },
    };
    const producerKeychain2: WithMetadata<ProducerKeychain> = {
      data: getMockProducerKeychain(1),
      metadata: {
        version: 1,
      },
    };

    const producerKeychainSQLObjects1 = splitProducerKeychainIntoObjectsSQL(
      producerKeychain1.data,
      producerKeychain1.metadata.version,
    );
    const producerKeychainSQLObjects2 = splitProducerKeychainIntoObjectsSQL(
      producerKeychain2.data,
      producerKeychain2.metadata.version,
    );

    const aggregatedProducerKeychains = aggregateProducerKeychains([
      ...createProducerKeychainAggregatorInput(producerKeychainSQLObjects1),
      ...createProducerKeychainAggregatorInput(producerKeychainSQLObjects2),
    ]);

    expect(aggregatedProducerKeychains).toEqual(
      expect.arrayContaining([
        {
          data: toExpectProducerKeychain(producerKeychain1.data),
          metadata: producerKeychain1.metadata,
        },
        {
          data: toExpectProducerKeychain(producerKeychain2.data),
          metadata: producerKeychain2.metadata,
        },
      ]),
    );
  });

  it("should convert Producer keychain SQL objects into a flat Producer keychain business object", () => {
    const producerKeychain: WithMetadata<ProducerKeychain> = {
      data: getMockProducerKeychain(),
      metadata: {
        version: 1,
      },
    };

    const producerKeychainSQLObjects = splitProducerKeychainIntoObjectsSQL(
      producerKeychain.data,
      producerKeychain.metadata.version,
    );

    const aggregated = aggregateFlatProducerKeychain(
      createProducerKeychainAggregatorInput(producerKeychainSQLObjects),
    );

    expect(aggregated).toEqual({
      data: toFlatProducerKeychain(producerKeychain.data),
      metadata: producerKeychain.metadata,
    });
  });

  it("should convert Producer keychain SQL objects into flat Producer keychain business objects", () => {
    const producerKeychain1: WithMetadata<ProducerKeychain> = {
      data: getMockProducerKeychain(),
      metadata: {
        version: 1,
      },
    };
    const producerKeychain2: WithMetadata<ProducerKeychain> = {
      data: getMockProducerKeychain(1),
      metadata: {
        version: 1,
      },
    };

    const sql1 = splitProducerKeychainIntoObjectsSQL(
      producerKeychain1.data,
      producerKeychain1.metadata.version,
    );
    const sql2 = splitProducerKeychainIntoObjectsSQL(
      producerKeychain2.data,
      producerKeychain2.metadata.version,
    );

    const aggregated = aggregateFlatProducerKeychains([
      ...createProducerKeychainAggregatorInput(sql1),
      ...createProducerKeychainAggregatorInput(sql2),
    ]);

    expect(aggregated).toEqual(
      expect.arrayContaining([
        {
          data: toFlatProducerKeychain(producerKeychain1.data),
          metadata: producerKeychain1.metadata,
        },
        {
          data: toFlatProducerKeychain(producerKeychain2.data),
          metadata: producerKeychain2.metadata,
        },
      ]),
    );
  });
});
