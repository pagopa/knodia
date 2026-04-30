import type {
  AgreementId,
  ConsumerKeychainId,
  CorrelationId,
  EserviceId,
  KnodiaApiKeychainId,
  OrganizationId,
  PurposeId,
} from "@knodia/common-models/ids";
import type { eventStoreAgreementEvents } from "@knodia/db-event-store-agreement";
import type { eventStoreEserviceEvents } from "@knodia/db-event-store-eservice";
import type { eventStoreKeychainEvents } from "@knodia/db-event-store-keychain";
import type { eventStoreOrganizationEvents } from "@knodia/db-event-store-organization";
import type { eventStorePurposeEvents } from "@knodia/db-event-store-purpose";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { AgreementEventV1 } from "@knodia/agreement-models";
import { EserviceEventV1 } from "@knodia/eservice-models";
import { KeychainEventV1 } from "@knodia/keychain-models";
import { OrganizationEventV1 } from "@knodia/organization-models";
import { PurposeEventV1 } from "@knodia/purpose-models";
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

const EventStoreEvents = z.union([
  EserviceEventV1,
  AgreementEventV1,
  KeychainEventV1,
  OrganizationEventV1,
  PurposeEventV1,
]);
interface CreatedEvent {
  newVersion: number;
  streamId: EventStoreStreamIds;
}
type EventStoreEvents = z.infer<typeof EventStoreEvents>;

type EventStoreStreamIds =
  | AgreementId
  | ConsumerKeychainId
  | EserviceId
  | KnodiaApiKeychainId
  | OrganizationId
  | PurposeId;

type EventStoreTables =
  | typeof eventStoreAgreementEvents
  | typeof eventStoreEserviceEvents
  | typeof eventStoreKeychainEvents
  | typeof eventStoreOrganizationEvents
  | typeof eventStorePurposeEvents;

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
    ): Promise<CreatedEvent> {
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

        return {
          newVersion,
          streamId: event.streamId,
        };
      });
    },
  };
}
