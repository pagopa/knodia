/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { Eservice } from "@knodia/eservice-models";

import { Agreement } from "@knodia/agreement-models";
import {
  generateId,
  KnodeId,
  type OrganizationId,
} from "@knodia/common-models/ids";
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

export const eservice2: Eservice = {
  ...getMockEservice({ latestVersionState: "Active", seed: 1 }),
  name: {
    en: "Test Eservice 2",
  },
  updatedAt: new Date(updatedAt.getTime() + 1000),
};
const eserviceVersion2 = eservice2.versions[0]!;

export const consumerId = generateId<OrganizationId>();
export const mockAgreements: Agreement[] = [
  {
    ...getMockAgreement(0),
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
    ...getMockAgreement(1),
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
    ...getMockAgreement(2),
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
    ...getMockAgreement(3),
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
    ...getMockAgreement(4),
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
    ...getMockAgreement(5),
    consumer: {
      id: generateId(),
      knodeId: KnodeId.parse("Lynx"),
    },
    eserviceId: eservice2.id,
    eserviceVersionId: eserviceVersion2.id,
    producerId: eservice2.producerId,
    state: "Active",
    updatedAt: new Date(updatedAt.getTime() + 11000),
  },
  {
    ...getMockAgreement(6),
    consumer: {
      id: generateId(),
      knodeId: KnodeId.parse("Orion"),
    },
    eserviceId: eservice2.id,
    eserviceVersionId: eserviceVersion2.id,
    producerId: eservice2.producerId,
    state: "Active",
    updatedAt: new Date(updatedAt.getTime() + 13000),
  },
  {
    ...getMockAgreement(7),
    consumer: {
      id: generateId(),
      knodeId: KnodeId.parse("Orion"),
    },
    eserviceId: eservice2.id,
    eserviceVersionId: eserviceVersion2.id,
    producerId: eservice2.producerId,
    state: "Suspended",
    updatedAt: new Date(updatedAt.getTime() + 15000),
  },
  {
    ...getMockAgreement(8),
    consumer: {
      id: generateId(),
      knodeId: KnodeId.parse("Orion"),
    },
    eserviceId: eservice2.id,
    eserviceVersionId: eserviceVersion2.id,
    producerId: eservice2.producerId,
    state: "Archived",
    updatedAt: new Date(updatedAt.getTime() + 17000),
  },
  {
    ...getMockAgreement(9),
    consumer: {
      id: generateId(),
      knodeId: KnodeId.parse("Orion"),
    },
    eserviceId: eservice2.id,
    eserviceVersionId: eserviceVersion2.id,
    producerId: eservice2.producerId,
    state: "Suspended",
    updatedAt: new Date(updatedAt.getTime() + 19000),
  },
];
