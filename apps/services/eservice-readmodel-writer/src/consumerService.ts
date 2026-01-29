import type { EserviceEventEnvelopeV1 } from "@knodia/eservice-models";

import { fromEserviceV1 } from "@knodia/eservice-models";
import { missingKafkaMessageDataError } from "@knodia/fastify-zod-api-commons/models";
import { match } from "ts-pattern";

import type { EserviceWriterService } from "./eserviceWriterService.ts";

export async function handleEserviceEvent(
  message: EserviceEventEnvelopeV1,
  writerService: EserviceWriterService,
): Promise<void> {
  return match(message)
    .with({ type: "EserviceVersionActivatedV1" }, async (msg) => {
      const eservice = msg.data.eservice;

      if (!eservice) {
        throw missingKafkaMessageDataError("eservice", msg.type);
      }

      await writerService.insertEservice(
        fromEserviceV1(eservice),
        message.version,
      );
    })
    .exhaustive();
}
