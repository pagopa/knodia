import { type Agreement } from "@knodia/agreement-models";
import { unsafeBrandId } from "@knodia/common-models/ids";
import {
  type Eservice,
  type EserviceInterface,
  type EserviceVersion,
} from "@knodia/eservice-models";
import {
  type ConsumerKeychain,
  type KnodeApiKeychain,
  type ProducerKeychain,
} from "@knodia/keychain-models";
import { type Organization } from "@knodia/organization-models";
import { expect } from "vitest";

export function toExpectAgreement(agreement: Agreement) {
  return {
    ...agreement,
    attributes: expect.arrayContaining(agreement.attributes),
  };
}

export function toExpectAPI_Eservice(
  eservice: Omit<
    Eservice,
    "createdAt" | "id" | "producerId" | "template" | "updatedAt"
  > & {
    createdAt: Date | string;
    id: string;
    producerId: string;
    template?: { id: string; knodeId: string };
    updatedAt: Date | string;
  },
) {
  return {
    ...toExpectAPI_FlatEservice(eservice),
    ...(eservice.receiveDataConfig !== undefined
      ? { receiveDataConfig: eservice.receiveDataConfig }
      : {}),
    versions: eservice.versions.map(toExpectAPI_EserviceVersion),
  };
}

export function toExpectAPI_EserviceVersion(eserviceVersion: EserviceVersion) {
  return expect.objectContaining({
    accessTokenAudience: expect.arrayContaining(
      eserviceVersion.accessTokenAudience,
    ),
    accessTokenDuration: eserviceVersion.accessTokenDuration,
    accessTokenType: eserviceVersion.accessTokenType,
    createdAt: eserviceVersion.createdAt.toISOString(),
    id: eserviceVersion.id,
    maxDailyCallsPerConsumer: eserviceVersion.maxDailyCallsPerConsumer,
    maxDailyCallsPerKnode: eserviceVersion.maxDailyCallsPerKnode,
    requiredAttributes: eserviceVersion.requiredAttributes.map((group) =>
      expect.arrayContaining(group),
    ),
    state: eserviceVersion.state,
    updatedAt: eserviceVersion.updatedAt.toISOString(),
    versionNumber: eserviceVersion.versionNumber,
  });
}

export function toExpectAPI_EserviceVersionInterfaceDocument(
  doc: EserviceInterface,
) {
  return {
    checksum: doc.checksum,
    contentType: doc.contentType,
    createdAt: doc.createdAt.toISOString(),
    id: doc.id,
    name: doc.name,
    path: doc.path,
    prettyName: doc.prettyName,
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export function toExpectAPI_FlatEservice(
  eservice: Omit<
    Eservice,
    "createdAt" | "id" | "producerId" | "template" | "updatedAt" | "versions"
  > & {
    createdAt: Date | string;
    id: string;
    producerId: string;
    template?: { id: string; knodeId: string };
    updatedAt: Date | string;
  },
) {
  return {
    categories: expect.arrayContaining(eservice.categories),
    createdAt: toExpectIsoOrNull(eservice.createdAt),
    description: eservice.description,
    id: unsafeBrandId(eservice.id),
    isConsumerOperatorIdentificationRequired:
      eservice.isConsumerOperatorIdentificationRequired,
    isSignalHubEnabled: eservice.isSignalHubEnabled,
    mode: eservice.mode,
    name: eservice.name,
    producerId: unsafeBrandId(eservice.producerId),
    ...(eservice.template ? { template: eservice.template } : {}),
    updatedAt: toExpectIsoOrNull(eservice.updatedAt),
  };
}

export function toExpectConsumerKeychain(consumerKeychain: ConsumerKeychain) {
  return expect.objectContaining({
    ...consumerKeychain,
    keys: expect.arrayContaining(consumerKeychain.keys),
    users: expect.arrayContaining(consumerKeychain.users),
  });
}

export function toExpectEservice(eservice: Eservice) {
  return {
    ...eservice,
    categories: expect.arrayContaining(eservice.categories),
    versions: expect.arrayContaining(
      eservice.versions.map(toExpectEserviceVersion),
    ),
  };
}

export function toExpectIsoOrNull(value: Date | null | string) {
  if (value === null) return null;
  return typeof value === "string" ? value : value.toISOString();
}

export function toExpectKnodeApiKeychain(knodeApiKeychain: KnodeApiKeychain) {
  return expect.objectContaining({
    ...knodeApiKeychain,
    keys: expect.arrayContaining(knodeApiKeychain.keys),
    users: expect.arrayContaining(knodeApiKeychain.users),
  });
}

export function toExpectOrganization(organization: Organization) {
  return {
    ...organization,
    attributes: expect.arrayContaining(organization.attributes),
  };
}

export function toExpectProducerKeychain(producerKeychain: ProducerKeychain) {
  return expect.objectContaining({
    ...producerKeychain,
    keys: expect.arrayContaining(producerKeychain.keys),
    users: expect.arrayContaining(producerKeychain.users),
  });
}

function toExpectEserviceVersion(eserviceVersion: EserviceVersion) {
  return expect.objectContaining({
    ...eserviceVersion,
    accessTokenAudience: expect.arrayContaining(
      eserviceVersion.accessTokenAudience,
    ),
    requiredAttributes: eserviceVersion.requiredAttributes.map((group) =>
      expect.arrayContaining(group),
    ),
  });
}
