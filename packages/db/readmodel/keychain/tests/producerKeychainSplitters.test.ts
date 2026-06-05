import {
  getMockProducerKeychain,
  getMockProducerKeychainEservice,
} from "@knodia/test-commons/utils";
import { describe, expect, it } from "vitest";

import type {
  ProducerKeychainEserviceSQL,
  ProducerKeychainKeySQL,
  ProducerKeychainSQL,
  ProducerKeychainUserSQL,
} from "../src/producerKeychain.ts";

import {
  splitProducerKeychainIntoObjectsSQL,
  toProducerKeychainEserviceSQL,
} from "../src/converters/producerKeychainSplitters.ts";

describe("Producer keychain splitters", () => {
  it("should split a Producer keychain business object into Producer keychain SQL objects", () => {
    const metadataVersion = 1;
    const producerKeychain = getMockProducerKeychain();

    const {
      producerKeychainKeysSQL,
      producerKeychainSQL,
      producerKeychainUsersSQL,
    } = splitProducerKeychainIntoObjectsSQL(producerKeychain, metadataVersion);

    const expectedProducerKeychainSQL: ProducerKeychainSQL = {
      createdAt: producerKeychain.createdAt,
      description: producerKeychain.description ?? null,
      id: producerKeychain.id,
      metadataVersion,
      name: producerKeychain.name,
      ownerId: producerKeychain.ownerId,
      updatedAt: producerKeychain.updatedAt,
    };

    const expectedProducerKeychainKeysSQL: ProducerKeychainKeySQL[] =
      producerKeychain.keys.map((key) => ({
        algorithm: key.algorithm,
        createdAt: key.createdAt,
        encodedPem: key.encodedPem,
        format: key.format,
        kid: key.kid,
        metadataVersion,
        name: key.name,
        producerKeychainId: producerKeychain.id,
        userId: key.userId,
      }));

    const expectedProducerKeychainUsersSQL: ProducerKeychainUserSQL[] =
      producerKeychain.users.map((user) => ({
        addedAt: user.addedAt,
        metadataVersion,
        producerKeychainId: producerKeychain.id,
        userId: user.userId,
      }));

    expect(producerKeychainSQL).toEqual(expectedProducerKeychainSQL);
    expect(producerKeychainKeysSQL).toEqual(
      expect.arrayContaining(expectedProducerKeychainKeysSQL),
    );
    expect(producerKeychainUsersSQL).toEqual(
      expect.arrayContaining(expectedProducerKeychainUsersSQL),
    );
  });

  it("should map an undefined description to null so onConflictDoUpdate clears the column", () => {
    const { producerKeychainSQL } = splitProducerKeychainIntoObjectsSQL(
      { ...getMockProducerKeychain(), description: undefined },
      1,
    );

    expect(producerKeychainSQL.description).toBeNull();
  });

  it("should split a Producer keychain Eservice business object into a Producer keychain Eservice SQL object", () => {
    const metadataVersion = 1;
    const producerKeychainEservice = getMockProducerKeychainEservice();

    const producerKeychainEserviceSQL = toProducerKeychainEserviceSQL(
      producerKeychainEservice,
      metadataVersion,
    );

    const expectedProducerKeychainEserviceSQL: ProducerKeychainEserviceSQL = {
      eserviceId: producerKeychainEservice.eserviceId,
      linkedAt: producerKeychainEservice.linkedAt,
      metadataVersion,
      producerKeychainId: producerKeychainEservice.producerKeychainId,
    };

    expect(producerKeychainEserviceSQL).toEqual(
      expectedProducerKeychainEserviceSQL,
    );
  });
});
