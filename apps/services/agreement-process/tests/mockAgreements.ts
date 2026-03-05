/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { Eservice } from "@knodia/eservice-models";

import { Agreement } from "@knodia/agreement-models";
import {
  generateId,
  KnodeId,
  type OrganizationId,
} from "@knodia/common-models/ids";
import { getMockEservice } from "@knodia/test-commons/utils";
import { zocker } from "zocker";

const createdAt = new Date();
const updatedAt = new Date(createdAt.getTime() + 1000);

export const eservice1: Eservice = {
  ...getMockEservice({ latestVersionState: "Active" }),
  name: {
    en: "Test Eservice 1",
  },
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

const zockerAgreements = zocker(Agreement).setSeed(0).generateMany(10);

export const consumerId = generateId<OrganizationId>();
export const mockAgreements: Agreement[] = [
  {
    ...(zockerAgreements[0] as Agreement),
    consumer: {
      id: consumerId,
      knodeId: KnodeId.parse("Orion"),
    },
    eserviceId: eservice1.id,
    eserviceVersionId: eserviceVersion1.id,
    state: "Active",
    updatedAt,
  },
  {
    ...(zockerAgreements[1] as Agreement),
    consumer: {
      id: consumerId,
      knodeId: KnodeId.parse("Orion"),
    },
    eserviceId: eservice1.id,
    eserviceVersionId: eserviceVersion1.id,
    state: "Suspended",
    updatedAt: new Date(updatedAt.getTime() + 3000),
  },
  {
    ...(zockerAgreements[2] as Agreement),
    consumer: {
      id: consumerId,
      knodeId: KnodeId.parse("Orion"),
    },
    eserviceId: eservice1.id,
    eserviceVersionId: eserviceVersion1.id,
    state: "Archived",
    updatedAt: new Date(updatedAt.getTime() + 5000),
  },
  {
    ...(zockerAgreements[3] as Agreement),
    consumer: {
      id: consumerId,
      knodeId: KnodeId.parse("Lynx"),
    },
    eserviceId: eservice1.id,
    eserviceVersionId: eserviceVersion1.id,
    state: "Archived",
    updatedAt: new Date(updatedAt.getTime() + 7000),
  },
  {
    ...(zockerAgreements[4] as Agreement),
    consumer: {
      id: consumerId,
      knodeId: KnodeId.parse("Lynx"),
    },
    eserviceId: eservice1.id,
    eserviceVersionId: eserviceVersion1.id,
    state: "Active",
    updatedAt: new Date(updatedAt.getTime() + 9000),
  },
  {
    ...(zockerAgreements[5] as Agreement),
    consumer: {
      id: generateId(),
      knodeId: KnodeId.parse("Lynx"),
    },
    eserviceId: eservice2.id,
    eserviceVersionId: eserviceVersion2.id,
    state: "Active",
    updatedAt: new Date(updatedAt.getTime() + 11000),
  },
  {
    ...(zockerAgreements[6] as Agreement),
    consumer: {
      id: generateId(),
      knodeId: KnodeId.parse("Orion"),
    },
    eserviceId: eservice2.id,
    eserviceVersionId: eserviceVersion2.id,
    state: "Active",
    updatedAt: new Date(updatedAt.getTime() + 13000),
  },
  {
    ...(zockerAgreements[7] as Agreement),
    consumer: {
      id: generateId(),
      knodeId: KnodeId.parse("Orion"),
    },
    eserviceId: eservice2.id,
    eserviceVersionId: eserviceVersion2.id,
    state: "Suspended",
    updatedAt: new Date(updatedAt.getTime() + 15000),
  },
  {
    ...(zockerAgreements[8] as Agreement),
    consumer: {
      id: generateId(),
      knodeId: KnodeId.parse("Orion"),
    },
    eserviceId: eservice2.id,
    eserviceVersionId: eserviceVersion2.id,
    state: "Archived",
    updatedAt: new Date(updatedAt.getTime() + 17000),
  },
  {
    ...(zockerAgreements[9] as Agreement),
    consumer: {
      id: generateId(),
      knodeId: KnodeId.parse("Orion"),
    },
    eserviceId: eservice2.id,
    eserviceVersionId: eserviceVersion2.id,
    state: "Suspended",
    updatedAt: new Date(updatedAt.getTime() + 19000),
  },
];
