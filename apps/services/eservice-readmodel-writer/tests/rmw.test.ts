import {
  EserviceId,
  EserviceInterfaceId,
  EserviceVersionId,
  generateId,
  OrganizationId,
} from "@knodia/common-models/ids";
import { protobufBinaryCodec } from "@knodia/common-models/protobuf";
import { toEserviceSQL } from "@knodia/db-readmodel-eservice/splitters";
import { toEserviceV1 } from "@knodia/eservice-models";
import { runConsumer } from "@knodia/kafka-commons";
import { sendTestEvent } from "@knodia/test-commons/kafka";
import { describe, expect, it } from "vitest";

import { EserviceVersionActivatedV1 } from "../../../../packages/models/eservice-models/src/generated/v1/eserviceEvents.ts";
import { consumedMessages, kafkaConfig, producer, topicName } from "./setup.ts";
import { getAllEservices, testConsumerHandler } from "./utils.ts";

describe("Test", async () => {
  it("test", async () => {
    const now = new Date();
    const eservice = {
      categories: [{ code: "category-1", scheme: "vocab-1" }],
      createdAt: now,
      description: { en: `Description for E-service ${1}` },
      id: generateId<EserviceId>(),
      isConsumerOperatorIdentificationRequired: false,
      isSignalHubEnabled: false,
      mode: "ProvideData" as const,
      name: { en: `E-service ${1}` },
      producerId: generateId<OrganizationId>(),
      updatedAt: now,
      versions: [
        {
          accessTokenAudience: ["audience-1"],
          accessTokenDuration: 3600,
          accessTokenType: "Bearer" as const,
          createdAt: now,
          id: generateId<EserviceVersionId>(),
          interfaceDocument: {
            checksum: "checksum-1",
            contentType: "application/json",
            createdAt: now,
            id: generateId<EserviceInterfaceId>(),
            name: "Interface 1",
            path: "/interfaces/1.json",
            prettyName: { en: "Interface 1" },
            updatedAt: now,
          },
          maxDailyCallsPerConsumer: 100,
          maxDailyCallsPerKnode: 1000,
          requiredAttributes: [[{ code: "attr-1", scheme: "attr-scheme-1" }]],
          state: "Active" as const,
          updatedAt: now,
          versionNumber: 1,
        },
      ],
    };

    const eventData = protobufBinaryCodec(EserviceVersionActivatedV1).encode({
      eservice: toEserviceV1(eservice),
      eserviceVersionId: generateId(),
    });

    const metadataVersion = 0;
    await sendTestEvent({
      data: eventData,
      eventType: "EserviceVersionActivatedV1",
      metadataVersion,
      producer,
      streamId: eservice.id,
      topicName,
    });

    await runConsumer([topicName], testConsumerHandler, kafkaConfig);

    await expect.poll(() => consumedMessages.length).toBe(1);

    const retrievedEservices = await getAllEservices();

    expect(retrievedEservices.length).toEqual(1);
    expect(retrievedEservices[0]).toEqual(
      toEserviceSQL(eservice, metadataVersion),
    );
  });
});
