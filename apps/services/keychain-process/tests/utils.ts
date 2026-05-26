import type {
  ConsumerKeychain,
  ConsumerKeychainPurpose,
  ConsumerKeychainV1,
  KnodeApiKeychain,
  ProducerKeychain,
} from "@knodia/keychain-models";
import type { Purpose } from "@knodia/purpose-models";
import type { remoteResourcesManagerApi } from "@knodia/remote-resources-manager-client";

import { generateId, type KnodeId } from "@knodia/common-models/ids";
import { decodeBase64Pem } from "@knodia/crypto";
import { eventStoreKeychainEvents } from "@knodia/db-event-store-keychain";
import { keychainEventStoreWriterBuilder } from "@knodia/db-event-store-writer/keychain";
import { createInjectAppRequest } from "@knodia/test-commons/fastify";
import {
  createEcKeyPair,
  createRsaKeyPair,
  rsaX509CertificatePem,
  toBase64,
  toExpectIsoOrNull,
} from "@knodia/test-commons/utils";
import { expect } from "vitest";

import {
  createConsumerKeychainCreatedV1Event,
  createConsumerKeychainPurposeLinkedV1Event,
  createProducerKeychainCreatedV1Event,
} from "../src/models/consumerKeychainEventFactory.ts";
import { createKnodeApiKeychainCreatedV1Event } from "../src/models/knodeApiKeychainEventFactory.ts";
import {
  app,
  consumerKeychainWriterService,
  eventStoreDb,
  knodeApiKeychainWriterService,
  producerKeychainWriterService,
} from "./setup.ts";

export async function getAllKeychainEvents() {
  return await eventStoreDb
    .select()
    .from(eventStoreKeychainEvents)
    .orderBy(eventStoreKeychainEvents.sequenceNum);
}

export const injectAppRequest = createInjectAppRequest(() => app);

export function createEcPublicKeyBase64() {
  return toBase64(createEcKeyPair().publicKey);
}

export function createMultiplePublicKeysBase64() {
  return toBase64(
    [
      decodeBase64Pem(createRsaPublicKeyBase64()).trim(),
      decodeBase64Pem(createRsaPublicKeyBase64()).trim(),
    ].join("\n"),
  );
}

export function createRsaPrivateKeyBase64() {
  return toBase64(createRsaKeyPair(2048).privateKey);
}

export function createRsaPublicKeyBase64() {
  return toBase64(createRsaKeyPair(2048).publicKey);
}

export function createShortRsaPublicKeyBase64() {
  return toBase64(createRsaKeyPair(1024).publicKey);
}

export function createX509CertificateBase64() {
  return toBase64(rsaX509CertificatePem);
}

export async function seedConsumerKeychain(consumerKeychain: ConsumerKeychain) {
  await keychainEventStoreWriterBuilder(eventStoreDb).insertEvent(
    createConsumerKeychainCreatedV1Event(consumerKeychain, generateId()),
  );
  await consumerKeychainWriterService.upsertConsumerKeychain(
    consumerKeychain,
    0,
  );
}

export async function seedConsumerKeychainPurpose(
  consumerKeychain: ConsumerKeychain,
  consumerKeychainPurpose: ConsumerKeychainPurpose,
) {
  await keychainEventStoreWriterBuilder(eventStoreDb).insertEvent(
    createConsumerKeychainPurposeLinkedV1Event({
      consumerKeychain,
      correlationId: generateId(),
      currentMetadataVersion: 0,
      linkedAt: consumerKeychainPurpose.linkedAt,
      purpose: consumerKeychainPurpose.purpose,
    }),
  );
  await consumerKeychainWriterService.upsertConsumerKeychainPurpose(
    consumerKeychainPurpose,
    1,
  );
}

export async function seedKnodeApiKeychain(knodeApiKeychain: KnodeApiKeychain) {
  await keychainEventStoreWriterBuilder(eventStoreDb).insertEvent(
    createKnodeApiKeychainCreatedV1Event(knodeApiKeychain, generateId()),
  );
  await knodeApiKeychainWriterService.upsertKnodeApiKeychain(
    knodeApiKeychain,
    0,
  );
}

export async function seedProducerKeychain(producerKeychain: ProducerKeychain) {
  await keychainEventStoreWriterBuilder(eventStoreDb).insertEvent(
    createProducerKeychainCreatedV1Event(producerKeychain, generateId()),
  );
  await producerKeychainWriterService.upsertProducerKeychain(
    producerKeychain,
    0,
  );
}

export function toExpectConsumerKeychainV1(
  consumerKeychain: ConsumerKeychainV1,
) {
  return expect.objectContaining({
    ...consumerKeychain,
    keys: expect.arrayContaining(consumerKeychain.keys),
    users: expect.arrayContaining(consumerKeychain.users),
  });
}

export function toRRM_Purpose(
  purpose: Purpose,
  knodeId: KnodeId,
): remoteResourcesManagerApi.Purpose {
  return {
    consumer: purpose.consumer,
    dailyCalls: purpose.dailyCalls,
    description: purpose.description,
    eserviceId: purpose.eserviceId,
    id: purpose.id,
    knodeId,
    name: purpose.name,
    state: purpose.state,
    suspendedByConsumerAt: toExpectIsoOrNull(purpose.suspendedByConsumerAt),
    suspendedByProducerAt: toExpectIsoOrNull(purpose.suspendedByProducerAt),
    updatedAt: purpose.updatedAt.toISOString(),
  };
}
