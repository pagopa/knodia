import { generateExternalId } from "@knodia/common-models/externalResource";
import {
  type EserviceId,
  generateId,
  KnodeId,
  type OrganizationId,
} from "@knodia/common-models/ids";
import { type Purpose, PurposeState } from "@knodia/purpose-models";
import { getMockPurpose } from "@knodia/test-commons/utils";

const createdAt = new Date();

export const eserviceId1 = generateId<EserviceId>();
export const eserviceId2 = generateId<EserviceId>();

export const consumerId1 = generateExternalId<OrganizationId>();
const consumerId2 = generateExternalId<OrganizationId>();
export const consumerKnodeId1 = KnodeId.parse("Orion");
const consumerKnodeId2 = KnodeId.parse("Lynx");

// 5 purposes with progressive updatedAt for sort testing (DESC)
// mockPurposes[4] is the most recent, mockPurposes[0] the oldest
export const mockPurposes: Purpose[] = [
  {
    ...getMockPurpose(0),
    consumer: { id: consumerId1, knodeId: consumerKnodeId1 },
    dailyCalls: 1000,
    description: { en: "Purpose 1 description" },
    eserviceId: eserviceId1,
    name: { en: "Purpose 1" },
    state: PurposeState.enum.Active,
    updatedAt: new Date(createdAt.getTime() + 1000),
  },
  {
    ...getMockPurpose(1),
    consumer: { id: consumerId1, knodeId: consumerKnodeId1 },
    dailyCalls: 500,
    description: { en: "Purpose 2 description" },
    eserviceId: eserviceId1,
    name: { en: "Purpose 2" },
    state: PurposeState.enum.Active,
    updatedAt: new Date(createdAt.getTime() + 2000),
  },
  {
    ...getMockPurpose(2),
    consumer: { id: consumerId2, knodeId: consumerKnodeId2 },
    dailyCalls: 200,
    description: { en: "Purpose 3 description" },
    eserviceId: eserviceId1,
    name: { en: "Purpose 3" },
    state: PurposeState.enum.Suspended,
    updatedAt: new Date(createdAt.getTime() + 3000),
  },
  {
    ...getMockPurpose(3),
    consumer: { id: consumerId2, knodeId: consumerKnodeId2 },
    dailyCalls: 300,
    description: { en: "Purpose 4 description" },
    eserviceId: eserviceId2,
    name: { en: "Purpose 4" },
    state: PurposeState.enum.Archived,
    updatedAt: new Date(createdAt.getTime() + 4000),
  },
  {
    ...getMockPurpose(4),
    consumer: { id: consumerId1, knodeId: consumerKnodeId1 },
    dailyCalls: 100,
    description: { en: "Purpose 5 description" },
    eserviceId: eserviceId2,
    name: { en: "Purpose 5" },
    state: PurposeState.enum.Active,
    updatedAt: new Date(createdAt.getTime() + 5000),
  },
];
