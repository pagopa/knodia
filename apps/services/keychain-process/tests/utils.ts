import type {
  ConsumerKeychain,
  ConsumerKeychainPurpose,
  ConsumerKeychainV1,
} from "@knodia/keychain-models";
import type { Purpose } from "@knodia/purpose-models";
import type { remoteResourcesManagerApi } from "@knodia/remote-resources-manager-client";

import { generateId, type KnodeId } from "@knodia/common-models/ids";
import { eventStoreKeychainEvents } from "@knodia/db-event-store-keychain";
import { keychainEventStoreWriterBuilder } from "@knodia/db-event-store-writer/keychain";
import { createInjectAppRequest } from "@knodia/test-commons/fastify";
import { expect } from "vitest";

import {
  createConsumerKeychainCreatedV1Event,
  createConsumerKeychainPurposeLinkedV1Event,
} from "../src/models/keychainEventFactory.ts";
import { app, eventStoreDb, keychainWriterService } from "./setup.ts";

export async function getAllKeychainEvents() {
  return await eventStoreDb.select().from(eventStoreKeychainEvents);
}

export const injectAppRequest = createInjectAppRequest(() => app);

export function makeCognitoUser({
  email,
  id,
  username,
}: {
  email: string;
  id: string;
  username: string;
}) {
  return {
    Attributes: [
      { Name: "sub", Value: id },
      { Name: "email", Value: email },
    ],
    Username: username,
  };
}

export async function seedConsumerKeychain(consumerKeychain: ConsumerKeychain) {
  await keychainEventStoreWriterBuilder(eventStoreDb).insertEvent(
    createConsumerKeychainCreatedV1Event(consumerKeychain, generateId()),
  );
  await keychainWriterService.upsertConsumerKeychain(consumerKeychain, 0);
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
  await keychainWriterService.upsertConsumerKeychainPurpose(
    consumerKeychainPurpose,
    1,
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
    suspendedByConsumerAt: purpose.suspendedByConsumerAt?.toISOString() ?? null,
    suspendedByProducerAt: purpose.suspendedByProducerAt?.toISOString() ?? null,
    updatedAt: purpose.updatedAt.toISOString(),
  };
}
