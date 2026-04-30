/* eslint-disable max-lines-per-function */
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
  FlatKnodiaApiKeychain,
  KnodiaApiKeychain,
  KnodiaApiKeychainKey,
} from "@knodia/keychain-models";

import { genericInternalError } from "@knodia/common-models/errors";
import {
  generateId,
  type KeyId,
  type KnodiaApiKeychainId,
  unsafeBrandKeyId,
  unsafeBrandUserId,
  type UserId,
} from "@knodia/common-models/ids";
import {
  calculateKid,
  createJWK,
  decodeBase64Pem,
} from "@knodia/fastify-zod-api-commons/crypto";
import { match, P } from "ts-pattern";

import type {
  API_GetKnodiaApiKeychainKeysQueryParams,
  API_GetKnodiaApiKeychainMembersQueryParams,
  API_GetKnodiaApiKeychainsQueryParams,
  API_KeychainKeySeed,
  API_KeychainMemberSeed,
  API_KnodiaApiKeychainPatch,
  API_KnodiaApiKeychainSeed,
} from "../models/api.ts";
import type { ReadmodelService } from "./readmodelService.ts";
import type { IdmUser, UserService } from "./userService.ts";

import {
  keyAlreadyExists,
  knodiaApiKeychainNotFound,
  userAlreadyMember,
  userNotFound,
} from "../models/errors.ts";
import {
  createKnodiaApiKeychainCreatedV1Event,
  createKnodiaApiKeychainDeletedV1Event,
  createKnodiaApiKeychainKeyAddedV1Event,
  createKnodiaApiKeychainKeyRemovedV1Event,
  createKnodiaApiKeychainMemberAddedV1Event,
  createKnodiaApiKeychainMemberRemovedV1Event,
  createKnodiaApiKeychainUpdatedV1Event,
} from "../models/knodiaApiKeychainEventFactory.ts";
import {
  retrieveKnodiaApiKeychain,
  retrieveKnodiaApiKeychainKey,
} from "../utils/retrievalUtils.ts";
import {
  assertKeychainKeysCountIsBelowThreshold,
  assertNotX509Certificate,
  assertOrganizationIsKeychainOwner,
  assertUserBelongsToOrganization,
  assertUserIsAllowedToPerformKeychainOperation,
  assertUserIsAllowedToRemoveKey,
  assertUserIsMemberOfKeychain,
} from "../utils/validators.ts";

export type KnodiaApiKeychainService = ReturnType<
  typeof knodiaApiKeychainServiceBuilder
>;

export function knodiaApiKeychainServiceBuilder(
  eventStoreWriter: KeychainEventStoreWriter,
  readmodelService: ReadmodelService,
  userService: UserService,
  config: { maxKeysPerKeychain: number },
) {
  async function retrieveUser(
    userId: UserId,
    knodiaApiKeychainId: KnodiaApiKeychainId,
  ): Promise<IdmUser> {
    const user = await userService.getUserById(userId);
    if (!user) {
      throw genericInternalError(
        `User ${userId} in Knodia API Keychain ${knodiaApiKeychainId} not found in IDM`,
      );
    }
    return user;
  }

  async function assertKeyIsUnique(
    kid: KeyId,
    keychainKeys: { kid: KeyId }[],
  ): Promise<void> {
    const alreadyExists =
      keychainKeys.some((key) => key.kid === kid) ||
      (await readmodelService.checkKnodiaApiKeychainKeyExists(kid));

    if (alreadyExists) {
      throw keyAlreadyExists(kid);
    }
  }

  return {
    async addKnodiaApiKeychainMember(
      knodiaApiKeychainId: KnodiaApiKeychainId,
      member: API_KeychainMemberSeed,
      { authData, correlationId, logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<WithMetadata<KnodiaApiKeychain>> {
      logger.info(
        `Adding member ${member.userId} to Knodia API Keychain ${knodiaApiKeychainId}`,
      );

      const keychain = await retrieveKnodiaApiKeychain(
        knodiaApiKeychainId,
        readmodelService,
      );

      assertOrganizationIsKeychainOwner(authData.organizationId, keychain.data);

      const userId = unsafeBrandUserId(member.userId);

      if (keychain.data.users.some((user) => user.userId === userId)) {
        throw userAlreadyMember(knodiaApiKeychainId, userId);
      }

      const user = await userService.getUserById(userId);

      if (!user) {
        throw userNotFound(userId);
      }

      const userGroups = await userService.getUserGroups(user.username);

      assertUserBelongsToOrganization(
        userId,
        authData.organizationId,
        userGroups,
      );

      const now = new Date();
      const updated: KnodiaApiKeychain = {
        ...keychain.data,
        updatedAt: now,
        users: [...keychain.data.users, { addedAt: now, userId: user.id }],
      };

      const { newVersion } = await eventStoreWriter.insertEvent(
        createKnodiaApiKeychainMemberAddedV1Event(
          updated,
          user.id,
          correlationId,
          keychain.metadata.version,
        ),
      );

      return { data: updated, metadata: { version: newVersion } };
    },
    async createKnodiaApiKeychain(
      seed: API_KnodiaApiKeychainSeed,
      { authData, correlationId, logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<WithMetadata<KnodiaApiKeychain>> {
      const knodiaApiKeychainId = generateId<KnodiaApiKeychainId>();
      const { organizationId: ownerId } = authData;

      logger.info(
        `Creating Knodia API Keychain ${knodiaApiKeychainId} for owner ${ownerId}`,
      );

      const now = new Date();
      const keychain: KnodiaApiKeychain = {
        createdAt: now,
        description: seed.description,
        id: knodiaApiKeychainId,
        keys: [],
        name: seed.name,
        ownerId,
        updatedAt: now,
        users: [],
      };

      const { newVersion } = await eventStoreWriter.insertEvent(
        createKnodiaApiKeychainCreatedV1Event(keychain, correlationId),
      );

      return { data: keychain, metadata: { version: newVersion } };
    },
    async deleteKnodiaApiKeychain(
      knodiaApiKeychainId: KnodiaApiKeychainId,
      { authData, correlationId, logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<void> {
      logger.info(`Deleting Knodia API Keychain ${knodiaApiKeychainId}`);

      const keychain = await retrieveKnodiaApiKeychain(
        knodiaApiKeychainId,
        readmodelService,
      );

      assertOrganizationIsKeychainOwner(authData.organizationId, keychain.data);

      await eventStoreWriter.insertEvent(
        createKnodiaApiKeychainDeletedV1Event(
          keychain.data,
          correlationId,
          keychain.metadata.version,
        ),
      );
    },
    async getKnodiaApiKeychain(
      knodiaApiKeychainId: KnodiaApiKeychainId,
      { logger }: AuthorizedContext<InternalAuthData | UISessionAuthData>,
    ): Promise<WithMetadata<KnodiaApiKeychain>> {
      logger.info(`Getting Knodia API Keychain ${knodiaApiKeychainId}`);
      return await retrieveKnodiaApiKeychain(
        knodiaApiKeychainId,
        readmodelService,
      );
    },
    async getKnodiaApiKeychainKey(
      knodiaApiKeychainId: KnodiaApiKeychainId,
      kid: KeyId,
      { logger }: AuthorizedContext<InternalAuthData | UISessionAuthData>,
    ): Promise<KnodiaApiKeychainKey> {
      logger.info(
        `Getting key ${kid} of Knodia API Keychain ${knodiaApiKeychainId}`,
      );

      const keychain = await retrieveKnodiaApiKeychain(
        knodiaApiKeychainId,
        readmodelService,
      );

      return retrieveKnodiaApiKeychainKey(keychain.data, kid);
    },
    async getKnodiaApiKeychainKeys(
      knodiaApiKeychainId: KnodiaApiKeychainId,
      params: API_GetKnodiaApiKeychainKeysQueryParams,
      { authData, logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<ListResult<KnodiaApiKeychainKey>> {
      logger.info(
        { params },
        `Getting keys of Knodia API Keychain ${knodiaApiKeychainId}`,
      );

      const keychain =
        await readmodelService.getFlatKnodiaApiKeychainById(
          knodiaApiKeychainId,
        );

      if (!keychain) {
        throw knodiaApiKeychainNotFound(knodiaApiKeychainId);
      }

      assertOrganizationIsKeychainOwner(authData.organizationId, keychain.data);

      return await readmodelService.getKnodiaApiKeychainKeys(
        knodiaApiKeychainId,
        params,
      );
    },
    async getKnodiaApiKeychainMember(
      knodiaApiKeychainId: KnodiaApiKeychainId,
      userId: UserId,
      { authData, logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<IdmUser> {
      logger.info(
        `Getting member ${userId} of Knodia API Keychain ${knodiaApiKeychainId}`,
      );

      const keychain = await retrieveKnodiaApiKeychain(
        knodiaApiKeychainId,
        readmodelService,
      );

      assertOrganizationIsKeychainOwner(authData.organizationId, keychain.data);
      assertUserIsMemberOfKeychain(
        userId,
        knodiaApiKeychainId,
        keychain.data.users,
      );

      return await retrieveUser(userId, knodiaApiKeychainId);
    },
    async getKnodiaApiKeychainMembers(
      knodiaApiKeychainId: KnodiaApiKeychainId,
      params: API_GetKnodiaApiKeychainMembersQueryParams,
      { authData, logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<ListResult<IdmUser>> {
      logger.info(
        { params },
        `Getting members of Knodia API Keychain ${knodiaApiKeychainId}`,
      );

      const { data: keychain } = await retrieveKnodiaApiKeychain(
        knodiaApiKeychainId,
        readmodelService,
      );

      assertOrganizationIsKeychainOwner(authData.organizationId, keychain);

      const paginatedUserIds = keychain.users
        .toSorted((a, b) => b.addedAt.getTime() - a.addedAt.getTime())
        .slice(params.offset, params.offset + params.limit);

      return {
        results: await Promise.all(
          paginatedUserIds.map(({ userId }) =>
            retrieveUser(userId, knodiaApiKeychainId),
          ),
        ),
        totalCount: keychain.users.length,
      };
    },
    async getKnodiaApiKeychains(
      params: API_GetKnodiaApiKeychainsQueryParams,
      { logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<ListResult<FlatKnodiaApiKeychain>> {
      logger.info({ params }, "Getting Knodia API keychains with params");
      return await readmodelService.getKnodiaApiKeychains(params);
    },
    async removeKnodiaApiKeychainKey(
      knodiaApiKeychainId: KnodiaApiKeychainId,
      kid: KeyId,
      { authData, correlationId, logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<WithMetadata<KnodiaApiKeychain>> {
      logger.info(
        `Removing key ${kid} from Knodia API Keychain ${knodiaApiKeychainId}`,
      );

      const keychain = await retrieveKnodiaApiKeychain(
        knodiaApiKeychainId,
        readmodelService,
      );

      assertOrganizationIsKeychainOwner(authData.organizationId, keychain.data);
      assertUserIsAllowedToRemoveKey(
        authData,
        knodiaApiKeychainId,
        keychain.data.users,
      );

      retrieveKnodiaApiKeychainKey(keychain.data, kid);

      const updated: KnodiaApiKeychain = {
        ...keychain.data,
        keys: keychain.data.keys.filter((k) => k.kid !== kid),
        updatedAt: new Date(),
      };

      const { newVersion } = await eventStoreWriter.insertEvent(
        createKnodiaApiKeychainKeyRemovedV1Event(
          updated,
          kid,
          correlationId,
          keychain.metadata.version,
        ),
      );

      return { data: updated, metadata: { version: newVersion } };
    },
    async removeKnodiaApiKeychainMember(
      knodiaApiKeychainId: KnodiaApiKeychainId,
      userId: UserId,
      { authData, correlationId, logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<WithMetadata<KnodiaApiKeychain>> {
      logger.info(
        `Removing member ${userId} from Knodia API Keychain ${knodiaApiKeychainId}`,
      );

      const keychain = await retrieveKnodiaApiKeychain(
        knodiaApiKeychainId,
        readmodelService,
      );

      assertOrganizationIsKeychainOwner(authData.organizationId, keychain.data);
      assertUserIsMemberOfKeychain(
        userId,
        knodiaApiKeychainId,
        keychain.data.users,
      );

      const updated: KnodiaApiKeychain = {
        ...keychain.data,
        updatedAt: new Date(),
        users: keychain.data.users.filter((m) => m.userId !== userId),
      };

      const { newVersion } = await eventStoreWriter.insertEvent(
        createKnodiaApiKeychainMemberRemovedV1Event(
          updated,
          userId,
          correlationId,
          keychain.metadata.version,
        ),
      );

      return { data: updated, metadata: { version: newVersion } };
    },
    async updateKnodiaApiKeychain(
      knodiaApiKeychainId: KnodiaApiKeychainId,
      update: API_KnodiaApiKeychainPatch,
      { authData, correlationId, logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<WithMetadata<KnodiaApiKeychain>> {
      logger.info(`Updating Knodia API Keychain ${knodiaApiKeychainId}`);

      const keychain = await retrieveKnodiaApiKeychain(
        knodiaApiKeychainId,
        readmodelService,
      );

      assertOrganizationIsKeychainOwner(authData.organizationId, keychain.data);

      const updated: KnodiaApiKeychain = {
        ...keychain.data,
        description: match(update.description)
          .with(null, () => undefined)
          .with(undefined, () => keychain.data.description)
          .with(P.nonNullable, (desc) => desc)
          .exhaustive(),
        name: update.name ?? keychain.data.name,
        updatedAt: new Date(),
      };

      const { newVersion } = await eventStoreWriter.insertEvent(
        createKnodiaApiKeychainUpdatedV1Event(
          updated,
          correlationId,
          keychain.metadata.version,
        ),
      );

      return { data: updated, metadata: { version: newVersion } };
    },
    async uploadKnodiaApiKeychainKey(
      knodiaApiKeychainId: KnodiaApiKeychainId,
      keySeed: API_KeychainKeySeed,
      { authData, correlationId, logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<WithMetadata<KnodiaApiKeychainKey>> {
      logger.info(
        `Uploading key to Knodia API Keychain ${knodiaApiKeychainId}`,
      );

      const keychain = await retrieveKnodiaApiKeychain(
        knodiaApiKeychainId,
        readmodelService,
      );

      assertOrganizationIsKeychainOwner(authData.organizationId, keychain.data);
      assertUserIsAllowedToPerformKeychainOperation(
        authData.userId,
        knodiaApiKeychainId,
        keychain.data.users,
      );

      assertKeychainKeysCountIsBelowThreshold(
        knodiaApiKeychainId,
        config.maxKeysPerKeychain,
        keychain.data.keys.length + 1,
      );

      const pemKey = decodeBase64Pem(keySeed.encodedPem);
      assertNotX509Certificate(pemKey);

      const jwk = createJWK({ pemKey });
      const kid = unsafeBrandKeyId(calculateKid(jwk));

      await assertKeyIsUnique(kid, keychain.data.keys);

      const newKey: KnodiaApiKeychainKey = {
        algorithm: "RS256",
        createdAt: new Date(),
        encodedPem: keySeed.encodedPem,
        format: "PublicKey",
        kid,
        name: keySeed.name,
        userId: authData.userId,
      };

      const updated: KnodiaApiKeychain = {
        ...keychain.data,
        keys: [...keychain.data.keys, newKey],
        updatedAt: new Date(),
      };

      const { newVersion } = await eventStoreWriter.insertEvent(
        createKnodiaApiKeychainKeyAddedV1Event(
          updated,
          kid,
          correlationId,
          keychain.metadata.version,
        ),
      );

      return { data: newKey, metadata: { version: newVersion } };
    },
  };
}
