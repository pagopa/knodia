import type { Purpose } from "@knodia/purpose-models";

import { generateExternalId } from "@knodia/common-models/externalResource";
import { KnodeId, type OrganizationId } from "@knodia/common-models/ids";
import { getMockPurpose } from "@knodia/test-commons/utils";

const createdAt = new Date();
const updatedAt = new Date(createdAt.getTime() + 1000);

export const mockPurposes: Purpose[] = [
  {
    ...getMockPurpose(0),
    consumer: {
      id: generateExternalId<OrganizationId>(),
      knodeId: KnodeId.parse("Orion"),
    },
    dailyCalls: 1000,
    description: { en: "Test purpose description" },
    formAnswersJson: { question1: "answer1" },
    name: { en: "Test Purpose 1" },
    state: "Active",
    updatedAt,
  },
  {
    ...getMockPurpose(1),
    consumer: {
      id: generateExternalId<OrganizationId>(),
      knodeId: KnodeId.parse("Lynx"),
    },
    dailyCalls: 500,
    description: { en: "Another purpose description" },
    formAnswersJson: {},
    name: { en: "Test Purpose 2" },
    state: "Suspended",
    updatedAt: new Date(updatedAt.getTime() + 1000),
  },
];
