import type {
  ConsumerKeychain,
  ConsumerKeychainPurpose,
  ConsumerKeychainV1,
} from "@knodia/keychain-models";

import { generateId } from "@knodia/common-models/ids";
import { eventStoreKeychainEvents } from "@knodia/db-event-store-keychain";
import { keychainEventStoreWriterBuilder } from "@knodia/db-event-store-writer/keychain";
import { createInjectAppRequest } from "@knodia/test-commons/fastify";
import crypto from "crypto";
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

export const toBase64 = (value: string) =>
  Buffer.from(value, "utf-8").toString("base64");

export const createRsaKeyPair = (modulusLength: number) =>
  crypto.generateKeyPairSync("rsa", {
    modulusLength,
    privateKeyEncoding: {
      format: "pem",
      type: "pkcs8",
    },
    publicKeyEncoding: {
      format: "pem",
      type: "spki",
    },
  });

export const createEcKeyPair = () =>
  crypto.generateKeyPairSync("ec", {
    namedCurve: "prime256v1",
    privateKeyEncoding: {
      format: "pem",
      type: "pkcs8",
    },
    publicKeyEncoding: {
      format: "pem",
      type: "spki",
    },
  });

export const rsaX509CertificatePem = `-----BEGIN CERTIFICATE-----
MIIDDTCCAfWgAwIBAgIUaTGJhqRlY/7J2yUYoHQILYTqCaAwDQYJKoZIhvcNAQEL
BQAwFjEUMBIGA1UEAwwLa25vZGlhLXRlc3QwHhcNMjYwNDAyMTUzODQxWhcNMjYw
NDAzMTUzODQxWjAWMRQwEgYDVQQDDAtrbm9kaWEtdGVzdDCCASIwDQYJKoZIhvcN
AQEBBQADggEPADCCAQoCggEBAJm5+TX/VLuYbMZD9Q0A1X2DOn0P9m04HXr60Qno
GLT7kXjjfXle54NQy4UQBvaKHcC0m3+1HZIK/SBjIb7oqTyVeHcabkg9bkrNd27X
ShaJMMkzK64vaQwsZet/TUip1VxKaYBviDFTRTxRuuw/Zhc+dCIFNJlHnsCNEP7Q
XSUTmsQ0Xottgasp6EAJ3vhR36eBlykI5n9qNOTtsKVEzI9yIjNR1/Fmm17l00jm
KwPiuRZBNzPtnfrr5ODZpxlsA+j8bsMAbPnSGY2geLT6S3awLn6bY/uB3FZjlzQ9
+RTax3TqXyRrVbKGTaEftVZHQkR+Q32xOdCrSsh/VByn0UcCAwEAAaNTMFEwHQYD
VR0OBBYEFAFKpwDNduJ2rCODTlJFQwrh7JJdMB8GA1UdIwQYMBaAFAFKpwDNduJ2
rCODTlJFQwrh7JJdMA8GA1UdEwEB/wQFMAMBAf8wDQYJKoZIhvcNAQELBQADggEB
ABIQk+6qDYuK96z344006R4mVZlk7+uVvQ5LRRMNNoo2QRbEYrHOrPzUfK4NB7ES
/I8cjqTagMinrb/2r+sfvAKfdVD5+a0BKtsKpWz/eAAwfGHb/7mL+aoejQbFT5+G
NkBdKFk0r+U+fNZKt6gkEkvSJoJYvam+EnyKzNy4feCP2TYRsli+lqJYaJxmbd2H
780ap02wm2irjBaCoW3ODVHUbzsEIcEMH3oHeMuXP5kdOtXVPdYFM24WGtBN6LNU
e8gii0NdJ5Sv/VTFpB11GXvlDOKV7w2hRbx8vvkLL0THvq0s5YmcRg6Urqm82n8y
wDbhe/fDrePo0lGawqs+LRA=
-----END CERTIFICATE-----`;
