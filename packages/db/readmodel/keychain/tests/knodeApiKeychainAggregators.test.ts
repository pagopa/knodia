import type { WithMetadata } from "@knodia/db-readmodel-commons/models";

import {
  FlatKnodeApiKeychain,
  type KnodeApiKeychain,
} from "@knodia/keychain-models";
import {
  getMockKnodeApiKeychain,
  toExpectKnodeApiKeychain,
} from "@knodia/test-commons/utils";
import { describe, expect, it } from "vitest";

import {
  aggregateFlatKnodeApiKeychain,
  aggregateFlatKnodeApiKeychains,
  aggregateKnodeApiKeychain,
  aggregateKnodeApiKeychains,
} from "../src/converters/knodeApiKeychainAggregators.ts";
import { splitKnodeApiKeychainIntoObjectsSQL } from "../src/converters/knodeApiKeychainSplitters.ts";
import { createKnodeApiKeychainAggregatorInput } from "./knodeApiKeychainUtils.ts";

describe("Knode API keychain aggregators", () => {
  it("should convert Knode API keychain SQL objects into a Knode API keychain business object", () => {
    const knodeApiKeychain: WithMetadata<KnodeApiKeychain> = {
      data: getMockKnodeApiKeychain(),
      metadata: {
        version: 1,
      },
    };

    const knodeApiKeychainSQLObjects = splitKnodeApiKeychainIntoObjectsSQL(
      knodeApiKeychain.data,
      knodeApiKeychain.metadata.version,
    );

    const aggregatedKnodeApiKeychain = aggregateKnodeApiKeychain(
      createKnodeApiKeychainAggregatorInput(knodeApiKeychainSQLObjects),
    );

    expect(aggregatedKnodeApiKeychain).toEqual({
      data: toExpectKnodeApiKeychain(knodeApiKeychain.data),
      metadata: knodeApiKeychain.metadata,
    });
  });

  it("should convert Knode API keychain SQL objects into Knode API keychain business objects", () => {
    const knodeApiKeychain1: WithMetadata<KnodeApiKeychain> = {
      data: getMockKnodeApiKeychain(),
      metadata: {
        version: 1,
      },
    };
    const knodeApiKeychain2: WithMetadata<KnodeApiKeychain> = {
      data: getMockKnodeApiKeychain(1),
      metadata: {
        version: 1,
      },
    };

    const knodeApiKeychainSQLObjects1 = splitKnodeApiKeychainIntoObjectsSQL(
      knodeApiKeychain1.data,
      knodeApiKeychain1.metadata.version,
    );
    const knodeApiKeychainSQLObjects2 = splitKnodeApiKeychainIntoObjectsSQL(
      knodeApiKeychain2.data,
      knodeApiKeychain2.metadata.version,
    );

    const aggregatedKnodeApiKeychains = aggregateKnodeApiKeychains([
      ...createKnodeApiKeychainAggregatorInput(knodeApiKeychainSQLObjects1),
      ...createKnodeApiKeychainAggregatorInput(knodeApiKeychainSQLObjects2),
    ]);

    expect(aggregatedKnodeApiKeychains).toEqual(
      expect.arrayContaining([
        {
          data: toExpectKnodeApiKeychain(knodeApiKeychain1.data),
          metadata: knodeApiKeychain1.metadata,
        },
        {
          data: toExpectKnodeApiKeychain(knodeApiKeychain2.data),
          metadata: knodeApiKeychain2.metadata,
        },
      ]),
    );
  });

  it("should convert Knode API keychain SQL objects into a flat Knode API keychain business object", () => {
    const knodeApiKeychain: WithMetadata<KnodeApiKeychain> = {
      data: getMockKnodeApiKeychain(),
      metadata: {
        version: 1,
      },
    };

    const knodeApiKeychainSQLObjects = splitKnodeApiKeychainIntoObjectsSQL(
      knodeApiKeychain.data,
      knodeApiKeychain.metadata.version,
    );

    const aggregated = aggregateFlatKnodeApiKeychain(
      createKnodeApiKeychainAggregatorInput(knodeApiKeychainSQLObjects),
    );

    expect(aggregated).toEqual({
      data: FlatKnodeApiKeychain.parse(knodeApiKeychain.data),
      metadata: knodeApiKeychain.metadata,
    });
  });

  it("should convert Knode API keychain SQL objects into flat Knode API keychain business objects", () => {
    const knodeApiKeychain1: WithMetadata<KnodeApiKeychain> = {
      data: getMockKnodeApiKeychain(),
      metadata: {
        version: 1,
      },
    };
    const knodeApiKeychain2: WithMetadata<KnodeApiKeychain> = {
      data: getMockKnodeApiKeychain(1),
      metadata: {
        version: 1,
      },
    };

    const sql1 = splitKnodeApiKeychainIntoObjectsSQL(
      knodeApiKeychain1.data,
      knodeApiKeychain1.metadata.version,
    );
    const sql2 = splitKnodeApiKeychainIntoObjectsSQL(
      knodeApiKeychain2.data,
      knodeApiKeychain2.metadata.version,
    );

    const aggregated = aggregateFlatKnodeApiKeychains([
      ...createKnodeApiKeychainAggregatorInput(sql1),
      ...createKnodeApiKeychainAggregatorInput(sql2),
    ]);

    expect(aggregated).toEqual(
      expect.arrayContaining([
        {
          data: FlatKnodeApiKeychain.parse(knodeApiKeychain1.data),
          metadata: knodeApiKeychain1.metadata,
        },
        {
          data: FlatKnodeApiKeychain.parse(knodeApiKeychain2.data),
          metadata: knodeApiKeychain2.metadata,
        },
      ]),
    );
  });
});
