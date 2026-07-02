import { generateId, type OrganizationId } from "@knodia/common-models/ids";
import {
  type Eservice,
  EserviceMode,
  EserviceVersionState,
} from "@knodia/eservice-models";
import {
  getMockEservice,
  getMockEserviceCategory,
  getMockEserviceVersion,
} from "@knodia/test-commons/utils";

export const producerId = generateId<OrganizationId>();

export const mockEservices: Eservice[] = [
  {
    ...getMockEservice({ seed: 0 }),
    mode: EserviceMode.enum.ProvideData,
    name: {
      en: "1 knodia 1",
    },
    producerId: generateId(),
    versions: [
      {
        ...getMockEserviceVersion(0),
        state: EserviceVersionState.enum.Archived,
        versionNumber: 1,
      },
      {
        ...getMockEserviceVersion(1),
        state: EserviceVersionState.enum.Suspended,
        versionNumber: 2,
      },
    ],
  },
  {
    ...getMockEservice({ seed: 1 }),
    description: {
      en: "2 %_\\ knodia 2",
    },
    mode: EserviceMode.enum.ProvideData,
    name: {
      en: "other name 1",
    },
    producerId,
    versions: [
      {
        ...getMockEserviceVersion(2),
        state: EserviceVersionState.enum.Archived,
        versionNumber: 1,
      },
      {
        ...getMockEserviceVersion(3),
        state: EserviceVersionState.enum.Suspended,
        versionNumber: 2,
      },
    ],
  },
  {
    ...getMockEservice({ seed: 2 }),
    mode: EserviceMode.enum.ReceiveData,
    name: {
      en: "other name 2",
    },
    producerId,
    versions: [
      {
        ...getMockEserviceVersion(4),
        state: EserviceVersionState.enum.Archived,
        versionNumber: 1,
      },
      {
        ...getMockEserviceVersion(5),
        state: EserviceVersionState.enum.Suspended,
        versionNumber: 2,
      },
    ],
  },
  {
    ...getMockEservice({ seed: 3 }),
    categories: [
      {
        ...getMockEserviceCategory(0),
        code: "3 %_\\ knodia 3",
      },
    ],
    mode: EserviceMode.enum.ReceiveData,
    name: {
      en: "other name 3",
    },
    producerId,
    versions: [
      {
        ...getMockEserviceVersion(6),
        state: EserviceVersionState.enum.Archived,
        versionNumber: 1,
      },
      {
        ...getMockEserviceVersion(7),
        state: EserviceVersionState.enum.Archived,
        versionNumber: 2,
      },
    ],
  },
  {
    ...getMockEservice({ seed: 4 }),
    mode: EserviceMode.enum.ProvideData,
    name: {
      en: "other name 4",
    },
    producerId,
    versions: [
      {
        ...getMockEserviceVersion(8),
        state: EserviceVersionState.enum.Archived,
        versionNumber: 1,
      },
      {
        ...getMockEserviceVersion(9),
        state: EserviceVersionState.enum.Suspended,
        versionNumber: 2,
      },
    ],
  },
  {
    ...getMockEservice({ seed: 5 }),
    mode: EserviceMode.enum.ReceiveData,
    name: {
      en: "other name 5",
    },
    producerId,
    versions: [
      {
        ...getMockEserviceVersion(10),
        state: EserviceVersionState.enum.Archived,
        versionNumber: 1,
      },
      {
        ...getMockEserviceVersion(11),
        state: EserviceVersionState.enum.Active,
        versionNumber: 2,
      },
    ],
  },
  {
    ...getMockEservice({ seed: 6 }),
    mode: EserviceMode.enum.ReceiveData,
    name: {
      en: "other name 6",
    },
    producerId,
    versions: [
      {
        ...getMockEserviceVersion(12),
        state: EserviceVersionState.enum.Archived,
        versionNumber: 1,
      },
      {
        ...getMockEserviceVersion(13),
        state: EserviceVersionState.enum.Active,
        versionNumber: 2,
      },
    ],
  },
  {
    ...getMockEservice({ seed: 7 }),
    mode: EserviceMode.enum.ProvideData,
    name: {
      en: "other name 7",
    },
    producerId,
    versions: [
      {
        ...getMockEserviceVersion(14),
        state: EserviceVersionState.enum.Archived,
        versionNumber: 1,
      },
      {
        ...getMockEserviceVersion(15),
        state: EserviceVersionState.enum.Archived,
        versionNumber: 2,
      },
    ],
  },
  {
    ...getMockEservice({ seed: 8 }),
    mode: EserviceMode.enum.ReceiveData,
    name: {
      en: "other name 8",
    },
    producerId,
    versions: [
      {
        ...getMockEserviceVersion(16),
        state: EserviceVersionState.enum.Archived,
        versionNumber: 1,
      },
      {
        ...getMockEserviceVersion(17),
        state: EserviceVersionState.enum.Suspended,
        versionNumber: 2,
      },
    ],
  },
  {
    ...getMockEservice({ seed: 9 }),
    mode: EserviceMode.enum.ReceiveData,
    name: {
      en: "other name 9",
    },
    producerId,
    versions: [
      {
        ...getMockEserviceVersion(18),
        state: EserviceVersionState.enum.Archived,
        versionNumber: 1,
      },
      {
        ...getMockEserviceVersion(19),
        state: EserviceVersionState.enum.Active,
        versionNumber: 2,
      },
    ],
  },
];
