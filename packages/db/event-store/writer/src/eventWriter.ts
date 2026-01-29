import type { EserviceId } from "@knodia/common-models/ids";
import type { eventStoreEserviceEvents } from "@knodia/db-event-store-eservice";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { EserviceEventV1 } from "@knodia/eservice-models";
import { desc, eq } from "drizzle-orm";
import z from "zod";

export type EventStoreWriter<
  TEvent extends EventStoreEvents,
  TStreamId extends EventStoreStreamIds,
> = ReturnType<typeof eventStoreWriterBuilder<TEvent, TStreamId>>;

export interface NewEventStoreEvent<
  TEvent extends EventStoreEvents,
  TStreamId extends EventStoreStreamIds,
> {
  correlationId: string;
  currentMetadataVersion: bigint | null;
  event: TEvent;
  streamId: TStreamId;
}

const EventStoreEvents = z.union([
  EserviceEventV1 /* , AgreementEventV1 | ... */,
]);
type EventStoreEvents = z.infer<typeof EventStoreEvents>;
type EventStoreStreamIds = EserviceId; // | AgreementId | ...;

type EventStoreTables =
  typeof eventStoreEserviceEvents; /* | typeof eventStoreAgreementEvents | ... */

export function eventStoreWriterBuilder<
  TEvent extends EventStoreEvents,
  TStreamId extends EventStoreStreamIds,
>(options: { db: NodePgDatabase; eventsTable: EventStoreTables }) {
  const { db, eventsTable } = options;

  return {
    async insertEvent(
      event: NewEventStoreEvent<TEvent, TStreamId>,
    ): Promise<void> {
      return db.transaction(async (tx) => {
        const [latestEvent] = await tx
          .select({ version: eventsTable.version })
          .from(eventsTable)
          .where(eq(eventsTable.streamId, event.streamId))
          .orderBy(desc(eventsTable.version))
          .limit(1);

        const currentMetadataVersion =
          event.currentMetadataVersion !== null
            ? BigInt(event.currentMetadataVersion)
            : null;
        const latestVersion = latestEvent?.version
          ? BigInt(latestEvent.version)
          : null;

        if (latestVersion !== currentMetadataVersion) {
          throw new Error(
            `Current metadata version ${currentMetadataVersion} is not the latest for stream ${String(event.streamId)} (latest is ${latestVersion})`,
          );
        }

        const newVersion =
          currentMetadataVersion !== null
            ? currentMetadataVersion + BigInt(1)
            : BigInt(0);

        const { data, type } = EventStoreEvents.encode(event.event);
        await tx.insert(eventsTable).values({
          correlationId: event.correlationId,
          data: Buffer.from(data),
          streamId: event.streamId,
          type,
          version: newVersion,
        });
      });
    },
  };
}
