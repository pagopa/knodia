import { toExternalResource } from "@knodia/common-models/externalResource";
import { type EserviceTemplateId, generateId } from "@knodia/common-models/ids";
import { describe, expect, it } from "vitest";

import type { Eservice } from "../src/eservice.ts";

import { fromEserviceV1 } from "../src/eserviceProtobufConverterFromV1.ts";
import { toEserviceV1 } from "../src/eserviceProtobufConverterToV1.ts";

describe("fromEserviceV1", () => {
  const baseReceiveEservice: Eservice = {
    categories: [{ code: "CODE", scheme: "SCHEME" }],
    createdAt: new Date(1),
    description: { en: "Service description" },
    id: generateId(),
    isConsumerOperatorIdentificationRequired: false,
    isSignalHubEnabled: true,
    mode: "ReceiveData",
    name: { en: "Test Service" },
    producerId: generateId(),
    receiveDataConfig: {
      purposeFormOptions: [
        {
          description: { en: "Form option description" },
          formAnswersJson: { foo: "bar" },
          formSchemaVersion: "1.0",
          id: generateId(),
          name: { en: "Form option name" },
        },
      ],
    },
    template: toExternalResource<EserviceTemplateId>(
      "11111111-1111-4111-8111-111111111111",
      "Lynx",
    ),
    updatedAt: new Date(1),
    versions: [],
  };

  it("throws when ReceiveDataConfigV1.purposeFormOptions is empty", () => {
    const validV1 = toEserviceV1(baseReceiveEservice);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const validReceiveDataConfigV1 = validV1.receiveDataConfig!;
    const invalidV1 = {
      ...validV1,
      receiveDataConfig: {
        ...validReceiveDataConfigV1,
        purposeFormOptions: [],
      },
    };

    expect(() => fromEserviceV1(invalidV1)).toThrow(
      "ReceiveDataConfigV1.purposeFormOptions must contain at least one element",
    );
  });
});
