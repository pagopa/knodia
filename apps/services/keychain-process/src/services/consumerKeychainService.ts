import type { KeychainEventStoreWriter } from "@knodia/db-event-store-writer/keychain";
import type {
  ListResult,
  WithMetadata,
} from "@knodia/db-readmodel-commons/models";
import type {
  InternalAuthData,
  UISessionAuthData,
} from "@knodia/fastify-zod-api-commons/auth";
import type { AuthorizedContext } from "@knodia/fastify-zod-api-commons/context";
import type {
  ConsumerKeychain,
  ConsumerKeychainPurpose,
  FlatConsumerKeychain,
} from "@knodia/keychain-models";

import {
  type ConsumerKeychainId,
  generateId,
  type PurposeId,
} from "@knodia/common-models/ids";
import { match, P } from "ts-pattern";

import type {
  API_ConsumerKeychainPatch,
  API_ConsumerKeychainSeed,
  API_GetConsumerKeychainsQueryParams,
} from "../models/api.ts";
import type { ReadmodelService } from "./readmodelService.ts";

import {
  createConsumerKeychainCreatedV1Event,
  createConsumerKeychainDeletedV1Event,
  createConsumerKeychainPurposeLinkedV1Event,
  createConsumerKeychainUpdatedV1Event,
} from "../models/keychainEventFactory.ts";
import {
  retrieveConsumerKeychain,
  retrieveConsumerKeychainPurpose,
  retrievePurpose,
} from "../utils/readmodelUtils.ts";
import { assertOrganizationIsKeychainOwner } from "../utils/validators.ts";

export type ConsumerKeychainService = ReturnType<
  typeof consumerKeychainServiceBuilder
>;

export function consumerKeychainServiceBuilder(
  eventStoreWriter: KeychainEventStoreWriter,
  readmodelService: ReadmodelService,
) {
  return {
    async createConsumerKeychain(
      seed: API_ConsumerKeychainSeed,
      { authData, correlationId, logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<WithMetadata<ConsumerKeychain>> {
      const consumerKeychainId = generateId<ConsumerKeychainId>();

      const { organizationId: ownerId } = authData;

      logger.info(
        `Creating Consumer Keychain ${consumerKeychainId} for owner ${ownerId} `,
      );

      const now = new Date();

      const consumerKeychain: ConsumerKeychain = {
        createdAt: now,
        description: seed.description,
        id: consumerKeychainId,
        keys: [],
        name: seed.name,
        ownerId,
        updatedAt: now,
        users: [],
      };

      const { newVersion } = await eventStoreWriter.insertEvent(
        createConsumerKeychainCreatedV1Event(consumerKeychain, correlationId),
      );

      return {
        data: consumerKeychain,
        metadata: { version: newVersion },
      };
    },
    async deleteConsumerKeychain(
      consumerKeychainId: ConsumerKeychainId,
      { authData, correlationId, logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<void> {
      logger.info(`Deleting Consumer Keychain ${consumerKeychainId}`);

      const consumerKeychain = await retrieveConsumerKeychain(
        consumerKeychainId,
        readmodelService,
      );

      assertOrganizationIsKeychainOwner(
        authData.organizationId,
        consumerKeychain.data,
      );

      await eventStoreWriter.insertEvent(
        createConsumerKeychainDeletedV1Event(
          consumerKeychain.data,
          correlationId,
          consumerKeychain.metadata.version,
        ),
      );
    },

    async getConsumerKeychain(
      consumerKeychainId: ConsumerKeychainId,
      { logger }: AuthorizedContext<InternalAuthData | UISessionAuthData>,
    ): Promise<WithMetadata<ConsumerKeychain>> {
      logger.info(`Getting Consumer Keychain with ID ${consumerKeychainId}`);

      return await retrieveConsumerKeychain(
        consumerKeychainId,
        readmodelService,
      );
    },

    async getConsumerKeychainPurpose(
      consumerKeychainId: ConsumerKeychainId,
      purposeId: PurposeId,
      { logger }: AuthorizedContext<InternalAuthData | UISessionAuthData>,
    ): Promise<WithMetadata<ConsumerKeychainPurpose>> {
      logger.info(
        `Getting Purpose ${purposeId} linked to Consumer Keychain ${consumerKeychainId}`,
      );

      await Promise.all([
        retrieveConsumerKeychain(consumerKeychainId, readmodelService),
        retrievePurpose(purposeId, readmodelService),
      ]);

      return await retrieveConsumerKeychainPurpose(
        consumerKeychainId,
        purposeId,
        readmodelService,
      );
    },

    async getConsumerKeychains(
      params: API_GetConsumerKeychainsQueryParams,
      { logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<ListResult<FlatConsumerKeychain>> {
      logger.info({ params }, "Getting Consumer keychains with params");

      return await readmodelService.getConsumerKeychains(params);
    },

    async linkPurposeToConsumerKeychain(
      consumerKeychainId: ConsumerKeychainId,
      purposeId: PurposeId,
      { correlationId, logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<WithMetadata<ConsumerKeychainPurpose>> {
      logger.info(
        `Linking Purpose ${purposeId} to Consumer Keychain ${consumerKeychainId}`,
      );

      const [consumerKeychain, purpose] = await Promise.all([
        retrieveConsumerKeychain(consumerKeychainId, readmodelService),
        retrievePurpose(purposeId, readmodelService),
      ]);

      const linkedAt = new Date();
      const { newVersion } = await eventStoreWriter.insertEvent(
        createConsumerKeychainPurposeLinkedV1Event(
          consumerKeychain.data,
          purpose.data,
          linkedAt,
          correlationId,
          consumerKeychain.metadata.version,
        ),
      );

      return {
        data: {
          consumerKeychainId,
          linkedAt,
          purposeId,
        },
        metadata: { version: newVersion },
      };
    },

    async updateConsumerKeychain(
      consumerKeychainId: ConsumerKeychainId,
      update: API_ConsumerKeychainPatch,
      { authData, correlationId, logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<WithMetadata<ConsumerKeychain>> {
      logger.info(`Updating Consumer Keychain ${consumerKeychainId}`);

      const consumerKeychain = await retrieveConsumerKeychain(
        consumerKeychainId,
        readmodelService,
      );

      assertOrganizationIsKeychainOwner(
        authData.organizationId,
        consumerKeychain.data,
      );

      const updatedConsumerKeychain: ConsumerKeychain = {
        ...consumerKeychain.data,
        description: match(update.description)
          .with(null, () => undefined)
          .with(undefined, () => consumerKeychain.data.description)
          .with(P.nonNullable, (desc) => desc)
          .exhaustive(),
        name: update.name ?? consumerKeychain.data.name,
        updatedAt: new Date(),
      };

      const { newVersion } = await eventStoreWriter.insertEvent(
        createConsumerKeychainUpdatedV1Event(
          updatedConsumerKeychain,
          correlationId,
          consumerKeychain.metadata.version,
        ),
      );

      return {
        data: updatedConsumerKeychain,
        metadata: { version: newVersion },
      };
    },
  };
}
