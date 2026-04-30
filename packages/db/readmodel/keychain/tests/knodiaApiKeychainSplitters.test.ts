import { getMockKnodiaApiKeychain } from "@knodia/test-commons/utils";
import { describe, expect, it } from "vitest";

import type {
  KnodiaApiKeychainKeySQL,
  KnodiaApiKeychainSQL,
  KnodiaApiKeychainUserSQL,
} from "../src/knodiaApiKeychain.ts";

import { splitKnodiaApiKeychainIntoObjectsSQL } from "../src/converters/knodiaApiKeychainSplitters.ts";

describe("Knodia API keychain splitters", () => {
  it("should split a Knodia API keychain business object into SQL objects", () => {
    const metadataVersion = 1;
    const keychain = getMockKnodiaApiKeychain();

    const {
      knodiaApiKeychainKeysSQL,
      knodiaApiKeychainSQL,
      knodiaApiKeychainUsersSQL,
    } = splitKnodiaApiKeychainIntoObjectsSQL(keychain, metadataVersion);

    const expectedSQL: KnodiaApiKeychainSQL = {
      createdAt: keychain.createdAt,
      description: keychain.description,
      id: keychain.id,
      metadataVersion,
      name: keychain.name,
      ownerId: keychain.ownerId,
      updatedAt: keychain.updatedAt,
    };

    const expectedKeysSQL: KnodiaApiKeychainKeySQL[] = keychain.keys.map(
      (key) => ({
        algorithm: key.algorithm,
        createdAt: key.createdAt,
        encodedPem: key.encodedPem,
        format: key.format,
        kid: key.kid,
        knodiaApiKeychainId: keychain.id,
        metadataVersion,
        name: key.name,
        userId: key.userId,
      }),
    );

    const expectedUsersSQL: KnodiaApiKeychainUserSQL[] = keychain.users.map(
      (user) => ({
        addedAt: user.addedAt,
        knodiaApiKeychainId: keychain.id,
        metadataVersion,
        userId: user.userId,
      }),
    );

    expect(knodiaApiKeychainSQL).toEqual(expectedSQL);
    expect(knodiaApiKeychainKeysSQL).toEqual(
      expect.arrayContaining(expectedKeysSQL),
    );
    expect(knodiaApiKeychainUsersSQL).toEqual(
      expect.arrayContaining(expectedUsersSQL),
    );
  });
});
