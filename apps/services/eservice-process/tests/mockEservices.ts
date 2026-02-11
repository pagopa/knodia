import { generateId, OrganizationId } from "@knodia/common-models/ids";
import {
  Eservice,
  EserviceCategory,
  EserviceMode,
  EserviceVersion,
  EserviceVersionState,
} from "@knodia/eservice-models";
import { zocker } from "zocker";

export const producerId = generateId<OrganizationId>();

const zockerEservices = zocker(Eservice).setSeed(0).generateMany(10);

const now = new Date();
export const mockEservices: Eservice[] = [
  {
    ...(zockerEservices[0] as Eservice),
    mode: EserviceMode.enum.ProvideData,
    name: {
      en: "1 knodia 1",
    },
    producerId: generateId(),
    updatedAt: now,
    versions: [
      {
        ...zocker(EserviceVersion).generate(),
        state: EserviceVersionState.enum.Suspended,
      },
    ],
  },
  {
    ...(zockerEservices[1] as Eservice),
    description: {
      en: "2 knodia 2",
    },
    mode: EserviceMode.enum.ProvideData,
    name: {
      en: "other name 1",
    },
    producerId,
    updatedAt: now,
    versions: [
      {
        ...zocker(EserviceVersion).generate(),
        state: EserviceVersionState.enum.Suspended,
      },
    ],
  },
  {
    ...(zockerEservices[2] as Eservice),
    mode: EserviceMode.enum.ReceiveData,
    name: {
      en: "other name 2",
    },
    producerId,
    updatedAt: now,
    versions: [
      {
        ...zocker(EserviceVersion).generate(),
        state: EserviceVersionState.enum.Suspended,
      },
    ],
  },
  {
    ...(zockerEservices[3] as Eservice),
    categories: [
      {
        ...zocker(EserviceCategory).generate(),
        code: "3 knodia 3",
      },
    ],
    mode: EserviceMode.enum.ReceiveData,
    name: {
      en: "other name 3",
    },
    producerId,
    updatedAt: now,
    versions: [
      {
        ...zocker(EserviceVersion).generate(),
        state: EserviceVersionState.enum.Archived,
      },
    ],
  },
  {
    ...(zockerEservices[4] as Eservice),
    mode: EserviceMode.enum.ProvideData,
    name: {
      en: "other name 4",
    },
    producerId,
    versions: [
      {
        ...zocker(EserviceVersion).generate(),
        state: EserviceVersionState.enum.Suspended,
      },
    ],
  },
  {
    ...(zockerEservices[5] as Eservice),
    mode: EserviceMode.enum.ReceiveData,
    name: {
      en: "other name 5",
    },
    producerId,
    versions: [
      {
        ...zocker(EserviceVersion).generate(),
        state: EserviceVersionState.enum.Active,
      },
    ],
  },
  {
    ...(zockerEservices[6] as Eservice),
    mode: EserviceMode.enum.ReceiveData,
    name: {
      en: "other name 6",
    },
    producerId,
    versions: [
      {
        ...zocker(EserviceVersion).generate(),
        state: EserviceVersionState.enum.Active,
      },
    ],
  },
  {
    ...(zockerEservices[7] as Eservice),
    mode: EserviceMode.enum.ProvideData,
    name: {
      en: "other name 7",
    },
    producerId,
    versions: [
      {
        ...zocker(EserviceVersion).generate(),
        state: EserviceVersionState.enum.Archived,
      },
    ],
  },
  {
    ...(zockerEservices[8] as Eservice),
    mode: EserviceMode.enum.ReceiveData,
    name: {
      en: "other name 8",
    },
    producerId,
    versions: [
      {
        ...zocker(EserviceVersion).generate(),
        state: EserviceVersionState.enum.Suspended,
      },
    ],
  },
  {
    ...(zockerEservices[9] as Eservice),
    mode: EserviceMode.enum.ReceiveData,
    name: {
      en: "other name 9",
    },
    producerId,
    versions: [
      {
        ...zocker(EserviceVersion).generate(),
        state: EserviceVersionState.enum.Active,
      },
    ],
  },
];
