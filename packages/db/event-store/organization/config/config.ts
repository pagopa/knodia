import { EventStoreConfig } from "@knodia/db-event-store-config/config";
import { env } from "node:process";
import { z } from "zod";

export const EventStoreOrganizationConfig = EventStoreConfig.and(
  z
    .object({
      EVENTSTORE_DB_ORGANIZATION_SCHEMA: z.string(),
    })
    .transform((c) => ({
      eventStoreDbOrganizationSchema: c.EVENTSTORE_DB_ORGANIZATION_SCHEMA,
    })),
);
type EventStoreOrganizationConfig = z.infer<
  typeof EventStoreOrganizationConfig
>;

export const eventStoreOrganizationConfig: EventStoreOrganizationConfig =
  EventStoreOrganizationConfig.parse(env);
