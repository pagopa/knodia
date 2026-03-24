/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { Eservice } from "@knodia/eservice-models";

import { type Agreement } from "@knodia/agreement-models";
import { generateExternalId } from "@knodia/common-models/externalResource";
import { KnodeId, type OrganizationId } from "@knodia/common-models/ids";
import { TEST_ORGANIZATION_ID } from "@knodia/test-commons/auth";
import { getMockAgreement, getMockEservice } from "@knodia/test-commons/utils";

const createdAt = new Date();
const updatedAt = new Date(createdAt.getTime() + 1000);

export const eservice1: Eservice = {
  ...getMockEservice({ latestVersionState: "Active" }),
  name: {
    en: "Test Eservice 1",
  },
  producerId: TEST_ORGANIZATION_ID,
  updatedAt,
};
const eserviceVersion1 = eservice1.versions[0]!;

const eservice2: Eservice = {
  ...getMockEservice({ latestVersionState: "Active", seed: 1 }),
  name: {
    en: "Test Eservice 2",
  },
  updatedAt: new Date(updatedAt.getTime() + 1000),
};
const eserviceVersion2 = eservice2.versions[0]!;

export const consumerId = generateExternalId<OrganizationId>();
export const mockAgreements: Agreement[] = [
  {
    ...getMockAgreement({ seed: 0 }),
    consumer: {
      id: consumerId,
      knodeId: KnodeId.parse("Orion"),
    },
    eserviceId: eservice1.id,
    eserviceVersionId: eserviceVersion1.id,
    producerId: eservice1.producerId,
    state: "Active",
    updatedAt,
  },
  {
    ...getMockAgreement({ seed: 1 }),
    consumer: {
      id: consumerId,
      knodeId: KnodeId.parse("Orion"),
    },
    eserviceId: eservice1.id,
    eserviceVersionId: eserviceVersion1.id,
    producerId: eservice1.producerId,
    state: "Suspended",
    updatedAt: new Date(updatedAt.getTime() + 3000),
  },
  {
    ...getMockAgreement({ seed: 2 }),
    consumer: {
      id: consumerId,
      knodeId: KnodeId.parse("Orion"),
    },
    eserviceId: eservice1.id,
    eserviceVersionId: eserviceVersion1.id,
    producerId: eservice1.producerId,
    state: "Archived",
    updatedAt: new Date(updatedAt.getTime() + 5000),
  },
  {
    ...getMockAgreement({ seed: 3 }),
    consumer: {
      id: consumerId,
      knodeId: KnodeId.parse("Lynx"),
    },
    eserviceId: eservice1.id,
    eserviceVersionId: eserviceVersion1.id,
    producerId: eservice1.producerId,
    state: "Archived",
    updatedAt: new Date(updatedAt.getTime() + 7000),
  },
  {
    ...getMockAgreement({ seed: 4 }),
    consumer: {
      id: consumerId,
      knodeId: KnodeId.parse("Lynx"),
    },
    eserviceId: eservice1.id,
    eserviceVersionId: eserviceVersion1.id,
    producerId: eservice1.producerId,
    state: "Active",
    updatedAt: new Date(updatedAt.getTime() + 9000),
  },
  {
    ...getMockAgreement({ seed: 5 }),
    consumer: {
      id: generateExternalId(),
      knodeId: KnodeId.parse("Lynx"),
    },
    eserviceId: eservice2.id,
    eserviceVersionId: eserviceVersion2.id,
    producerId: eservice2.producerId,
    state: "Active",
    updatedAt: new Date(updatedAt.getTime() + 11000),
  },
  {
    ...getMockAgreement({ seed: 6 }),
    consumer: {
      id: generateExternalId(),
      knodeId: KnodeId.parse("Orion"),
    },
    eserviceId: eservice2.id,
    eserviceVersionId: eserviceVersion2.id,
    producerId: eservice2.producerId,
    state: "Active",
    updatedAt: new Date(updatedAt.getTime() + 13000),
  },
  {
    ...getMockAgreement({ seed: 7 }),
    consumer: {
      id: generateExternalId(),
      knodeId: KnodeId.parse("Orion"),
    },
    eserviceId: eservice2.id,
    eserviceVersionId: eserviceVersion2.id,
    producerId: eservice2.producerId,
    state: "Suspended",
    updatedAt: new Date(updatedAt.getTime() + 15000),
  },
  {
    ...getMockAgreement({ seed: 8 }),
    consumer: {
      id: generateExternalId(),
      knodeId: KnodeId.parse("Orion"),
    },
    eserviceId: eservice2.id,
    eserviceVersionId: eserviceVersion2.id,
    producerId: eservice2.producerId,
    state: "Archived",
    updatedAt: new Date(updatedAt.getTime() + 17000),
  },
  {
    ...getMockAgreement({ seed: 9 }),
    consumer: {
      id: generateExternalId(),
      knodeId: KnodeId.parse("Orion"),
    },
    eserviceId: eservice2.id,
    eserviceVersionId: eserviceVersion2.id,
    producerId: eservice2.producerId,
    state: "Suspended",
    updatedAt: new Date(updatedAt.getTime() + 19000),
  },
];
