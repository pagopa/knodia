import { getMockConsumerKeychain } from "@knodia/test-commons/utils";
import { describe, expect, it } from "vitest";

import type {
  ConsumerKeychainKeySQL,
  ConsumerKeychainSQL,
  ConsumerKeychainUserSQL,
} from "../src/consumerKeychain.ts";

import { splitConsumerKeychainIntoObjectsSQL } from "../src/converters/splitters.ts";

describe("Consumer keychain splitters", () => {
  it("should split a Consumer keychain business object into Consumer keychain SQL objects", () => {
    const metadataVersion = 1;
    const consumerKeychain = getMockConsumerKeychain();

    const {
      consumerKeychainKeysSQL,
      consumerKeychainSQL,
      consumerKeychainUsersSQL,
    } = splitConsumerKeychainIntoObjectsSQL(consumerKeychain, metadataVersion);

    const expectedConsumerKeychainSQL: ConsumerKeychainSQL = {
      createdAt: consumerKeychain.createdAt,
      description: consumerKeychain.description,
      id: consumerKeychain.id,
      metadataVersion,
      name: consumerKeychain.name,
      ownerId: consumerKeychain.ownerId,
      updatedAt: consumerKeychain.updatedAt,
    };

    const expectedConsumerKeychainKeysSQL: ConsumerKeychainKeySQL[] =
      consumerKeychain.keys.map((key) => ({
        algorithm: key.algorithm,
        consumerKeychainId: consumerKeychain.id,
        createdAt: key.createdAt,
        encodedPem: key.encodedPem,
        format: key.format,
        kid: key.kid,
        metadataVersion,
        name: key.name,
        userId: key.userId,
      }));

    const expectedConsumerKeychainUsersSQL: ConsumerKeychainUserSQL[] =
      consumerKeychain.users.map((userId) => ({
        consumerKeychainId: consumerKeychain.id,
        metadataVersion,
        userId,
      }));

    expect(consumerKeychainSQL).toEqual(expectedConsumerKeychainSQL);
    expect(consumerKeychainKeysSQL).toEqual(
      expect.arrayContaining(expectedConsumerKeychainKeysSQL),
    );
    expect(consumerKeychainUsersSQL).toEqual(
      expect.arrayContaining(expectedConsumerKeychainUsersSQL),
    );
  });
});
