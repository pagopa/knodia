import type { WithMetadata } from "@knodia/db-readmodel-commons/models";
import type { KnodiaApiKeychain } from "@knodia/keychain-models";

import {
  getMockKnodiaApiKeychain,
  toExpectKnodiaApiKeychain,
} from "@knodia/test-commons/utils";
import { describe, expect, it } from "vitest";

import {
  aggregateKnodiaApiKeychain,
  aggregateKnodiaApiKeychains,
} from "../src/converters/knodiaApiKeychainAggregators.ts";
import { splitKnodiaApiKeychainIntoObjectsSQL } from "../src/converters/knodiaApiKeychainSplitters.ts";
import { createKnodiaApiKeychainAggregatorInput } from "./utils.ts";

describe("Knodia API keychain aggregators", () => {
  it("should convert Knodia API keychain SQL objects into a Knodia API keychain business object", () => {
    const keychain: WithMetadata<KnodiaApiKeychain> = {
      data: getMockKnodiaApiKeychain(),
      metadata: { version: 1 },
    };

    const sqlObjects = splitKnodiaApiKeychainIntoObjectsSQL(
      keychain.data,
      keychain.metadata.version,
    );

    const aggregated = aggregateKnodiaApiKeychain(
      createKnodiaApiKeychainAggregatorInput(sqlObjects),
    );

    expect(aggregated).toEqual({
      data: toExpectKnodiaApiKeychain(keychain.data),
      metadata: keychain.metadata,
    });
  });

  it("should convert Knodia API keychain SQL objects into Knodia API keychain business objects", () => {
    const keychain1: WithMetadata<KnodiaApiKeychain> = {
      data: getMockKnodiaApiKeychain(),
      metadata: { version: 1 },
    };
    const keychain2: WithMetadata<KnodiaApiKeychain> = {
      data: getMockKnodiaApiKeychain(1),
      metadata: { version: 1 },
    };

    const sql1 = splitKnodiaApiKeychainIntoObjectsSQL(
      keychain1.data,
      keychain1.metadata.version,
    );
    const sql2 = splitKnodiaApiKeychainIntoObjectsSQL(
      keychain2.data,
      keychain2.metadata.version,
    );

    const aggregated = aggregateKnodiaApiKeychains([
      ...createKnodiaApiKeychainAggregatorInput(sql1),
      ...createKnodiaApiKeychainAggregatorInput(sql2),
    ]);

    expect(aggregated).toEqual(
      expect.arrayContaining([
        {
          data: toExpectKnodiaApiKeychain(keychain1.data),
          metadata: keychain1.metadata,
        },
        {
          data: toExpectKnodiaApiKeychain(keychain2.data),
          metadata: keychain2.metadata,
        },
      ]),
    );
  });
});
