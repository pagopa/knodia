import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { type EserviceId } from "@knodia/common-models/ids";
import { eventStoreEserviceEvents } from "@knodia/db-event-store-eservice";
import { desc, eq } from "drizzle-orm";

export type EventStoreWriterService = ReturnType<
  typeof eventStoreWriterServiceBuilder
>;

// TODO generalize to reuse for other event store writers
export interface NewEventStoreEserviceEvent {
  correlationId: string;
  currentMetadataVersion: bigint | null;
  data: Buffer<ArrayBufferLike>;
  streamId: EserviceId;
  type: string; // TODO type based on Eservice events?
}

export function eventStoreWriterServiceBuilder(db: NodePgDatabase) {
  return {
    async insertEserviceEvent(
      event: NewEventStoreEserviceEvent,
    ): Promise<void> {
      // TODO generalize logic to reuse for other event store writers
      return db.transaction(async (tx) => {
        const [latestEvent] = await tx
          .select({ version: eventStoreEserviceEvents.version })
          .from(eventStoreEserviceEvents)
          .where(eq(eventStoreEserviceEvents.streamId, event.streamId))
          .orderBy(desc(eventStoreEserviceEvents.version))
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
            `Current metadata version ${currentMetadataVersion} is not the latest for stream ${event.streamId} (latest is ${latestVersion})`,
          );
        }

        const newVersion =
          currentMetadataVersion !== null
            ? currentMetadataVersion + BigInt(1)
            : BigInt(1);

        await tx.insert(eventStoreEserviceEvents).values({
          correlationId: event.correlationId,
          data: event.data,
          streamId: event.streamId,
          type: event.type,
          version: newVersion,
        });
      });
    },
  };
}
