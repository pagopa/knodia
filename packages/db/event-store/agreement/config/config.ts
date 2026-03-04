import { EventStoreConfig } from "@knodia/db-event-store-config/config";
import { env } from "node:process";
import { z } from "zod";

export const EventStoreAgreementConfig = EventStoreConfig.and(
  z
    .object({
      EVENTSTORE_DB_AGREEMENT_SCHEMA: z.string().default("agreement"),
    })
    .transform((c) => ({
      eventStoreDbAgreementSchema: c.EVENTSTORE_DB_AGREEMENT_SCHEMA,
    })),
);
type EventStoreAgreementConfig = z.infer<typeof EventStoreAgreementConfig>;

export const eventStoreAgreementConfig: EventStoreAgreementConfig =
  EventStoreAgreementConfig.parse(env);
