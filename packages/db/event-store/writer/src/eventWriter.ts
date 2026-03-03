import type {
  ConsumerKeychainId,
  CorrelationId,
  EserviceId,
} from "@knodia/common-models/ids";
import type { eventStoreEserviceEvents } from "@knodia/db-event-store-eservice";
import type { eventStoreKeychainEvents } from "@knodia/db-event-store-keychain";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { EserviceEventV1 } from "@knodia/eservice-models";
import { KeychainEventV1 } from "@knodia/keychain-models";
import { desc, eq } from "drizzle-orm";
import z from "zod";

export interface NewEventStoreEvent<
  TEvent extends EventStoreEvents,
  TStreamId extends EventStoreStreamIds,
> {
  correlationId: CorrelationId;
  currentMetadataVersion: number | undefined;
  event: TEvent;
  streamId: TStreamId;
}

const EventStoreEvents = z.union([EserviceEventV1, KeychainEventV1]);
type EventStoreEvents = z.infer<typeof EventStoreEvents>;
type EventStoreStreamIds = ConsumerKeychainId | EserviceId;

type EventStoreTables =
  | typeof eventStoreEserviceEvents
  | typeof eventStoreKeychainEvents; /* | typeof eventStoreAgreementEvents | ... */

export const computeNextMetadataVersion = <
  TStreamId extends EventStoreStreamIds,
>({
  currentVersion,
  latestVersion,
  streamId,
}: {
  currentVersion: number | undefined;
  latestVersion: number | undefined;
  streamId: TStreamId;
}): number => {
  if (latestVersion !== currentVersion) {
    throw new Error(
      `Current metadata version ${currentVersion} is not the latest for stream ${streamId} (latest is ${latestVersion})`,
    );
  }

  return currentVersion !== undefined ? currentVersion + 1 : 0;
};

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

        const newVersion = computeNextMetadataVersion({
          currentVersion: event.currentMetadataVersion,
          latestVersion: latestEvent?.version,
          streamId: event.streamId,
        });

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
