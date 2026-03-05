import type { AgreementEventV1 } from "@knodia/agreement-models";
import type { AgreementId } from "@knodia/common-models/ids";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { eventStoreAgreementEvents } from "@knodia/db-event-store-agreement";

import {
  eventStoreWriterBuilder,
  type NewEventStoreEvent,
} from "./eventWriter.ts";

export type AgreementEventStoreWriter = ReturnType<
  typeof agreementEventStoreWriterBuilder
>;
export type NewEventStoreAgreementEvent = NewEventStoreEvent<
  AgreementEventV1,
  AgreementId
>;

export const agreementEventStoreWriterBuilder = (db: NodePgDatabase) =>
  eventStoreWriterBuilder({
    db,
    eventsTable: eventStoreAgreementEvents,
  });
