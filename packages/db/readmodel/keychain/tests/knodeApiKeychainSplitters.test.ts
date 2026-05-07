import { getMockKnodeApiKeychain } from "@knodia/test-commons/utils";
import { describe, expect, it } from "vitest";

import type {
  KnodeApiKeychainKeySQL,
  KnodeApiKeychainSQL,
  KnodeApiKeychainUserSQL,
} from "../src/knodeApiKeychain.ts";

import { splitKnodeApiKeychainIntoObjectsSQL } from "../src/converters/knodeApiKeychainSplitters.ts";

describe("Knode API keychain splitters", () => {
  it("should split a Knode API keychain business object into Knode API keychain SQL objects", () => {
    const metadataVersion = 1;
    const knodeApiKeychain = getMockKnodeApiKeychain();

    const {
      knodeApiKeychainKeysSQL,
      knodeApiKeychainSQL,
      knodeApiKeychainUsersSQL,
    } = splitKnodeApiKeychainIntoObjectsSQL(knodeApiKeychain, metadataVersion);

    const expectedKnodeApiKeychainSQL: KnodeApiKeychainSQL = {
      createdAt: knodeApiKeychain.createdAt,
      description: knodeApiKeychain.description,
      id: knodeApiKeychain.id,
      metadataVersion,
      name: knodeApiKeychain.name,
      ownerId: knodeApiKeychain.ownerId,
      updatedAt: knodeApiKeychain.updatedAt,
    };

    const expectedKnodeApiKeychainKeysSQL: KnodeApiKeychainKeySQL[] =
      knodeApiKeychain.keys.map((key) => ({
        algorithm: key.algorithm,
        createdAt: key.createdAt,
        encodedPem: key.encodedPem,
        format: key.format,
        kid: key.kid,
        knodeApiKeychainId: knodeApiKeychain.id,
        metadataVersion,
        name: key.name,
        userId: key.userId,
      }));

    const expectedKnodeApiKeychainUsersSQL: KnodeApiKeychainUserSQL[] =
      knodeApiKeychain.users.map((user) => ({
        addedAt: user.addedAt,
        knodeApiKeychainId: knodeApiKeychain.id,
        metadataVersion,
        userId: user.userId,
      }));

    expect(knodeApiKeychainSQL).toEqual(expectedKnodeApiKeychainSQL);
    expect(knodeApiKeychainKeysSQL).toEqual(
      expect.arrayContaining(expectedKnodeApiKeychainKeysSQL),
    );
    expect(knodeApiKeychainUsersSQL).toEqual(
      expect.arrayContaining(expectedKnodeApiKeychainUsersSQL),
    );
  });
});
