/* eslint-disable max-lines-per-function */
import type { CognitoIdmClient, IdmUser } from "@knodia/cognito-idm-client";
import type { KeychainEventStoreWriter } from "@knodia/db-event-store-writer/keychain";
import type {
  ListResult,
  WithMetadata,
} from "@knodia/db-readmodel-commons/models";
import type {
  KnodeApiAuthData,
  UISessionAuthData,
} from "@knodia/fastify-zod-api-commons/auth";
import type { AuthorizedContext } from "@knodia/fastify-zod-api-commons/context";
import type {
  FlatProducerKeychain,
  KeychainKey,
  ProducerKeychain,
  ProducerKeychainEservice,
} from "@knodia/keychain-models";

import {
  type EserviceId,
  generateId,
  type KeyId,
  type ProducerKeychainId,
  type UserId,
} from "@knodia/common-models/ids";

import type {
  API_GetProducerKeychainEservicesQueryParams,
  API_GetProducerKeychainKeysQueryParams,
  API_GetProducerKeychainMembersQueryParams,
  API_GetProducerKeychainsQueryParams,
  API_KeychainKeySeed,
  API_KeychainMemberSeed,
  API_KeychainPatch,
  API_KeychainSeed,
} from "../models/api.ts";
import type { ReadmodelService } from "./readmodelService.ts";

import {
  createProducerKeychainCreatedV1Event,
  createProducerKeychainDeletedV1Event,
  createProducerKeychainEserviceLinkedV1Event,
  createProducerKeychainEserviceUnlinkedV1Event,
  createProducerKeychainKeyAddedV1Event,
  createProducerKeychainKeyRemovedV1Event,
  createProducerKeychainMemberAddedV1Event,
  createProducerKeychainMemberRemovedV1Event,
  createProducerKeychainUpdatedV1Event,
} from "../models/producerKeychainEventFactory.ts";
import {
  retrieveEservice,
  retrieveFlatProducerKeychain,
  retrieveKeychainKey,
  retrieveKeychainMember,
  retrievePaginatedKeychainUsers,
  retrieveProducerKey,
  retrieveProducerKeychain,
  retrieveProducerKeychainEservice,
} from "../utils/retrievalUtils.ts";
import {
  addKeyToKeychain,
  addMemberToKeychain,
  removeKeyFromKeychain,
  removeMemberFromKeychain,
  updateKeychain,
} from "../utils/utils.ts";
import {
  assertEserviceIsNotLinkedToProducerKeychain,
  assertOrganizationIsEserviceProducer,
  assertOrganizationIsKeychainOwner,
} from "../utils/validators.ts";

export type ProducerKeychainService = ReturnType<
  typeof producerKeychainServiceBuilder
>;

export function producerKeychainServiceBuilder(
  eventStoreWriter: KeychainEventStoreWriter,
  readmodelService: ReadmodelService,
  cognitoIdmClient: CognitoIdmClient,
  config: { maxKeysPerKeychain: number },
) {
  return {
    async addProducerKeychainMember(
      producerKeychainId: ProducerKeychainId,
      member: API_KeychainMemberSeed,
      { authData, correlationId, logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<WithMetadata<UserId>> {
      logger.info(
        `Adding member ${member.userId} to Producer Keychain ${producerKeychainId}`,
      );

      const producerKeychain = await retrieveProducerKeychain(
        producerKeychainId,
        readmodelService,
      );

      const { addedUserId, updatedKeychain: updatedProducerKeychain } =
        await addMemberToKeychain(
          producerKeychain.data,
          member,
          authData,
          cognitoIdmClient,
        );

      const { newVersion } = await eventStoreWriter.insertEvent(
        createProducerKeychainMemberAddedV1Event(
          updatedProducerKeychain,
          addedUserId,
          correlationId,
          producerKeychain.metadata.version,
        ),
      );

      return {
        data: addedUserId,
        metadata: { version: newVersion },
      };
    },
    async createProducerKeychain(
      seed: API_KeychainSeed,
      { authData, correlationId, logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<WithMetadata<ProducerKeychain>> {
      const producerKeychainId = generateId<ProducerKeychainId>();

      const { organizationId: ownerId } = authData;

      logger.info(
        `Creating Producer Keychain ${producerKeychainId} for owner ${ownerId}`,
      );

      const now = new Date();

      const producerKeychain: ProducerKeychain = {
        createdAt: now,
        description: seed.description,
        id: producerKeychainId,
        keys: [],
        name: seed.name,
        ownerId,
        updatedAt: now,
        users: [],
      };

      const { newVersion } = await eventStoreWriter.insertEvent(
        createProducerKeychainCreatedV1Event(producerKeychain, correlationId),
      );

      return {
        data: producerKeychain,
        metadata: { version: newVersion },
      };
    },
    async deleteProducerKeychain(
      producerKeychainId: ProducerKeychainId,
      { authData, correlationId, logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<void> {
      logger.info(`Deleting Producer Keychain ${producerKeychainId}`);

      const producerKeychain = await retrieveProducerKeychain(
        producerKeychainId,
        readmodelService,
      );

      assertOrganizationIsKeychainOwner(
        authData.organizationId,
        producerKeychain.data,
      );

      await eventStoreWriter.insertEvent(
        createProducerKeychainDeletedV1Event(
          producerKeychain.data,
          correlationId,
          producerKeychain.metadata.version,
        ),
      );
    },
    async getProducerKey(
      kid: KeyId,
      { logger }: AuthorizedContext<KnodeApiAuthData>,
    ): Promise<KeychainKey> {
      logger.info(`Getting Producer Key with ID ${kid}`);

      return await retrieveProducerKey(kid, readmodelService);
    },
    async getProducerKeychain(
      producerKeychainId: ProducerKeychainId,
      { logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<WithMetadata<FlatProducerKeychain>> {
      logger.info(`Getting Producer Keychain with ID ${producerKeychainId}`);

      return await retrieveFlatProducerKeychain(
        producerKeychainId,
        readmodelService,
      );
    },
    async getProducerKeychainEservice(
      producerKeychainId: ProducerKeychainId,
      eserviceId: EserviceId,
      { logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<WithMetadata<ProducerKeychainEservice>> {
      logger.info(
        `Getting E-service ${eserviceId} linked to Producer Keychain ${producerKeychainId}`,
      );

      await retrieveFlatProducerKeychain(producerKeychainId, readmodelService);

      return await retrieveProducerKeychainEservice(
        { eserviceId, producerKeychainId },
        readmodelService,
      );
    },
    async getProducerKeychainEservices(
      producerKeychainId: ProducerKeychainId,
      params: API_GetProducerKeychainEservicesQueryParams,
      { logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<ListResult<ProducerKeychainEservice>> {
      logger.info(
        { params },
        `Getting E-services linked to Producer Keychain ${producerKeychainId} with params`,
      );

      await retrieveFlatProducerKeychain(producerKeychainId, readmodelService);

      return await readmodelService.getProducerKeychainEservices(
        producerKeychainId,
        params,
      );
    },
    async getProducerKeychainKey(
      producerKeychainId: ProducerKeychainId,
      kid: KeyId,
      { logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<KeychainKey> {
      logger.info(
        `Getting key with ID ${kid} of Producer Keychain with ID ${producerKeychainId}`,
      );

      const producerKeychain = await retrieveProducerKeychain(
        producerKeychainId,
        readmodelService,
      );

      return retrieveKeychainKey(producerKeychain.data, kid);
    },
    async getProducerKeychainKeys(
      producerKeychainId: ProducerKeychainId,
      params: API_GetProducerKeychainKeysQueryParams,
      { authData, logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<ListResult<KeychainKey>> {
      logger.info(
        { params },
        `Getting keys of Producer Keychain with ID ${producerKeychainId}`,
      );

      const producerKeychain = await retrieveFlatProducerKeychain(
        producerKeychainId,
        readmodelService,
      );

      assertOrganizationIsKeychainOwner(
        authData.organizationId,
        producerKeychain.data,
      );

      return await readmodelService.getProducerKeychainKeys(
        producerKeychainId,
        params,
      );
    },
    async getProducerKeychainMember(
      producerKeychainId: ProducerKeychainId,
      userId: UserId,
      { authData, logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<IdmUser> {
      logger.info(
        `Getting member ${userId} of Producer Keychain with id ${producerKeychainId}`,
      );

      const producerKeychain = await retrieveProducerKeychain(
        producerKeychainId,
        readmodelService,
      );

      return await retrieveKeychainMember({
        authData,
        cognitoIdmClient,
        keychain: producerKeychain.data,
        userId,
      });
    },
    async getProducerKeychainMembers(
      producerKeychainId: ProducerKeychainId,
      params: API_GetProducerKeychainMembersQueryParams,
      { authData, logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<ListResult<IdmUser>> {
      logger.info(
        { params },
        `Getting members of Producer Keychain with id ${producerKeychainId}, with params`,
      );

      const { data: producerKeychain } = await retrieveProducerKeychain(
        producerKeychainId,
        readmodelService,
      );

      assertOrganizationIsKeychainOwner(
        authData.organizationId,
        producerKeychain,
      );

      return await retrievePaginatedKeychainUsers({
        cognitoIdmClient,
        paginationParams: params,
        users: producerKeychain.users,
      });
    },
    async getProducerKeychains(
      params: API_GetProducerKeychainsQueryParams,
      { logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<ListResult<FlatProducerKeychain>> {
      logger.info({ params }, "Getting Producer keychains with params");

      return await readmodelService.getProducerKeychains(params);
    },
    async linkEserviceToProducerKeychain(
      {
        eserviceId,
        producerKeychainId,
      }: {
        eserviceId: EserviceId;
        producerKeychainId: ProducerKeychainId;
      },
      { authData, correlationId, logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<WithMetadata<ProducerKeychainEservice>> {
      logger.info(
        `Linking E-service ${eserviceId} to Producer Keychain ${producerKeychainId}`,
      );

      const [producerKeychain, eservice] = await Promise.all([
        retrieveProducerKeychain(producerKeychainId, readmodelService),
        retrieveEservice(eserviceId, readmodelService),
        assertEserviceIsNotLinkedToProducerKeychain(
          producerKeychainId,
          eserviceId,
          readmodelService,
        ),
      ]);
      assertOrganizationIsKeychainOwner(
        authData.organizationId,
        producerKeychain.data,
      );
      assertOrganizationIsEserviceProducer(
        authData.organizationId,
        eservice.data,
      );

      const linkedAt = new Date();
      const { newVersion } = await eventStoreWriter.insertEvent(
        createProducerKeychainEserviceLinkedV1Event({
          correlationId,
          currentMetadataVersion: producerKeychain.metadata.version,
          eserviceId,
          linkedAt,
          producerKeychain: producerKeychain.data,
        }),
      );

      return {
        data: { eserviceId, linkedAt, producerKeychainId },
        metadata: { version: newVersion },
      };
    },
    async removeProducerKeychainKey(
      producerKeychainId: ProducerKeychainId,
      kid: KeyId,
      { authData, correlationId, logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<WithMetadata<ProducerKeychain>> {
      logger.info(
        `Removing key ${kid} from Producer Keychain ${producerKeychainId}`,
      );

      const producerKeychain = await retrieveProducerKeychain(
        producerKeychainId,
        readmodelService,
      );

      const updatedProducerKeychain = removeKeyFromKeychain(
        producerKeychain.data,
        authData,
        kid,
      );

      const { newVersion } = await eventStoreWriter.insertEvent(
        createProducerKeychainKeyRemovedV1Event(
          updatedProducerKeychain,
          kid,
          correlationId,
          producerKeychain.metadata.version,
        ),
      );

      return {
        data: updatedProducerKeychain,
        metadata: { version: newVersion },
      };
    },
    async removeProducerKeychainMember(
      producerKeychainId: ProducerKeychainId,
      userId: UserId,
      { authData, correlationId, logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<WithMetadata<ProducerKeychain>> {
      logger.info(
        `Removing member ${userId} from Producer Keychain ${producerKeychainId}`,
      );

      const producerKeychain = await retrieveProducerKeychain(
        producerKeychainId,
        readmodelService,
      );

      const { updatedKeychain: updatedProducerKeychain } =
        removeMemberFromKeychain(producerKeychain.data, userId, authData);

      const { newVersion } = await eventStoreWriter.insertEvent(
        createProducerKeychainMemberRemovedV1Event(
          updatedProducerKeychain,
          userId,
          correlationId,
          producerKeychain.metadata.version,
        ),
      );

      return {
        data: updatedProducerKeychain,
        metadata: { version: newVersion },
      };
    },
    async unlinkEserviceFromProducerKeychain(
      {
        eserviceId,
        producerKeychainId,
      }: {
        eserviceId: EserviceId;
        producerKeychainId: ProducerKeychainId;
      },
      { authData, correlationId, logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<WithMetadata<ProducerKeychainEservice>> {
      logger.info(
        `Unlinking E-service ${eserviceId} from Producer Keychain ${producerKeychainId}`,
      );

      const [producerKeychain, producerKeychainEservice] = await Promise.all([
        retrieveProducerKeychain(producerKeychainId, readmodelService),
        retrieveProducerKeychainEservice(
          { eserviceId, producerKeychainId },
          readmodelService,
        ),
      ]);
      assertOrganizationIsKeychainOwner(
        authData.organizationId,
        producerKeychain.data,
      );

      const { newVersion } = await eventStoreWriter.insertEvent(
        createProducerKeychainEserviceUnlinkedV1Event({
          correlationId,
          currentMetadataVersion: producerKeychain.metadata.version,
          eserviceId,
          producerKeychain: producerKeychain.data,
        }),
      );

      return {
        data: producerKeychainEservice.data,
        metadata: { version: newVersion },
      };
    },
    async updateProducerKeychain(
      producerKeychainId: ProducerKeychainId,
      update: API_KeychainPatch,
      { authData, correlationId, logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<WithMetadata<ProducerKeychain>> {
      logger.info(`Updating Producer Keychain ${producerKeychainId}`);

      const producerKeychain = await retrieveProducerKeychain(
        producerKeychainId,
        readmodelService,
      );

      const updatedProducerKeychain = updateKeychain(
        producerKeychain.data,
        update,
        authData,
      );

      const { newVersion } = await eventStoreWriter.insertEvent(
        createProducerKeychainUpdatedV1Event(
          updatedProducerKeychain,
          correlationId,
          producerKeychain.metadata.version,
        ),
      );

      return {
        data: updatedProducerKeychain,
        metadata: { version: newVersion },
      };
    },
    async uploadProducerKeychainKey(
      producerKeychainId: ProducerKeychainId,
      keySeed: API_KeychainKeySeed,
      { authData, correlationId, logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<WithMetadata<KeychainKey>> {
      logger.info(`Uploading key to Producer Keychain ${producerKeychainId}`);

      const producerKeychain = await retrieveProducerKeychain(
        producerKeychainId,
        readmodelService,
      );

      const { newKey, updatedKeychain: updatedProducerKeychain } =
        await addKeyToKeychain(
          producerKeychain.data,
          authData,
          keySeed,
          readmodelService,
          config.maxKeysPerKeychain,
        );

      const { newVersion } = await eventStoreWriter.insertEvent(
        createProducerKeychainKeyAddedV1Event(
          updatedProducerKeychain,
          newKey.kid,
          correlationId,
          producerKeychain.metadata.version,
        ),
      );

      return {
        data: newKey,
        metadata: { version: newVersion },
      };
    },
  };
}
