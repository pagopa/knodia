import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { type EserviceId } from "@knodia/common-models/ids";
import { EserviceEventV1 } from "@knodia/eservice-models";
import { desc, eq } from "drizzle-orm";

import { eventStoreEserviceEvents } from "./eservice.ts";

export type EserviceEventStoreWriter = ReturnType<
  typeof eserviceEventStoreWriterBuilder
>;

// TODO generalize to reuse for other event store writers
export interface NewEventStoreEserviceEvent<TEvent extends EserviceEventV1> {
  correlationId: string;
  currentMetadataVersion: bigint | null;
  event: TEvent;
  streamId: EserviceId;
}

export function eserviceEventStoreWriterBuilder(db: NodePgDatabase) {
  return {
    async insertEserviceEvent<T extends EserviceEventV1>(
      event: NewEventStoreEserviceEvent<T>,
    ): Promise<void> {
      // TODO generalize logic to reuse for other event store writers
      await db.transaction(async (tx) => {
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
            : BigInt(0);

        const { data, type } = EserviceEventV1.encode(event.event);
        await tx.insert(eventStoreEserviceEvents).values({
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
