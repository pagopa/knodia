import { type Agreement } from "@knodia/agreement-models";
import { unsafeBrandId } from "@knodia/common-models/ids";
import {
  type Eservice,
  type EserviceInterface,
  type EserviceVersion,
} from "@knodia/eservice-models";
import { type ConsumerKeychain } from "@knodia/keychain-models";
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
    "createdAt" | "id" | "producerId" | "updatedAt" | "versions"
  > & {
    createdAt: Date | string;
    id: string;
    producerId: string;
    updatedAt: Date | string;
  },
) {
  const toISOString = (value: Date | string) =>
    value instanceof Date ? value.toISOString() : value;

  return {
    categories: expect.arrayContaining(eservice.categories),
    createdAt: toISOString(eservice.createdAt),
    description: eservice.description,
    id: unsafeBrandId(eservice.id),
    isConsumerOperatorIdentificationRequired:
      eservice.isConsumerOperatorIdentificationRequired,
    isSignalHubEnabled: eservice.isSignalHubEnabled,
    mode: eservice.mode,
    name: eservice.name,
    producerId: unsafeBrandId(eservice.producerId),
    updatedAt: toISOString(eservice.updatedAt),
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

export function toExpectConsumerKeychain(consumerKeychain: ConsumerKeychain) {
  return expect.objectContaining({
    ...consumerKeychain,
    keys: expect.arrayContaining(consumerKeychain.keys),
    purposes: expect.arrayContaining(consumerKeychain.purposes),
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

export function toExpectOrganization(organization: Organization) {
  return {
    ...organization,
    attributes: expect.arrayContaining(organization.attributes),
  };
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
