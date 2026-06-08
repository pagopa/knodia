import type { CognitoIdmClient, IdmUser } from "@knodia/cognito-idm-client";
import type { API_PaginationQueryParams } from "@knodia/common-models/api";
import type {
  ConsumerKeychainId,
  EserviceId,
  KeyId,
  KnodeApiKeychainId,
  ProducerKeychainId,
  UserId,
} from "@knodia/common-models/ids";
import type { ListResult } from "@knodia/db-readmodel-commons/models";
import type { UISessionAuthData } from "@knodia/fastify-zod-api-commons/auth";
import type {
  ConsumerKeychain,
  ConsumerKeychainPurpose,
  KeychainUser,
  KnodeApiKeychain,
  ProducerKeychain,
  ProducerKeychainEservice,
} from "@knodia/keychain-models";

import type { ReadmodelService } from "../services/readmodelService.ts";

import {
  consumerKeychainNotFound,
  consumerKeychainPurposeNotFound,
  eserviceNotFound,
  keychainMemberNotFound,
  keyNotFoundInKeychain,
  knodeApiKeychainNotFound,
  producerKeychainEserviceNotFound,
  producerKeychainNotFound,
} from "../models/errors.ts";
import {
  assertOrganizationIsKeychainOwner,
  assertUserIsMemberOfKeychain,
} from "./validators.ts";

export const retrieveConsumerKeychain = async (
  consumerKeychainId: ConsumerKeychainId,
  readmodelService: ReadmodelService,
) => {
  const consumerKeychain =
    await readmodelService.getConsumerKeychainById(consumerKeychainId);

  if (!consumerKeychain) {
    throw consumerKeychainNotFound(consumerKeychainId);
  }

  return consumerKeychain;
};

export const retrieveEservice = async (
  eserviceId: EserviceId,
  readmodelService: ReadmodelService,
) => {
  const eservice = await readmodelService.getEserviceById(eserviceId);

  if (!eservice) {
    throw eserviceNotFound(eserviceId);
  }

  return eservice;
};

export const retrieveFlatConsumerKeychain = async (
  consumerKeychainId: ConsumerKeychainId,
  readmodelService: ReadmodelService,
) => {
  const consumerKeychain =
    await readmodelService.getFlatConsumerKeychainById(consumerKeychainId);

  if (!consumerKeychain) {
    throw consumerKeychainNotFound(consumerKeychainId);
  }

  return consumerKeychain;
};

export const retrieveFlatKnodeApiKeychain = async (
  knodeApiKeychainId: KnodeApiKeychainId,
  readmodelService: ReadmodelService,
) => {
  const knodeApiKeychain =
    await readmodelService.getFlatKnodeApiKeychainById(knodeApiKeychainId);

  if (!knodeApiKeychain) {
    throw knodeApiKeychainNotFound(knodeApiKeychainId);
  }

  return knodeApiKeychain;
};

export const retrieveKnodeApiKeychain = async (
  knodeApiKeychainId: KnodeApiKeychainId,
  readmodelService: ReadmodelService,
) => {
  const knodeApiKeychain =
    await readmodelService.getKnodeApiKeychainById(knodeApiKeychainId);

  if (!knodeApiKeychain) {
    throw knodeApiKeychainNotFound(knodeApiKeychainId);
  }

  return knodeApiKeychain;
};

export const retrieveConsumerKeychainPurpose = async (
  consumerKeychainPurpose: Omit<ConsumerKeychainPurpose, "linkedAt">,
  readmodelService: ReadmodelService,
) => {
  const consumerKeychainPurposeResult =
    await readmodelService.getConsumerKeychainPurpose(consumerKeychainPurpose);

  if (!consumerKeychainPurposeResult) {
    throw consumerKeychainPurposeNotFound(consumerKeychainPurpose);
  }

  return consumerKeychainPurposeResult;
};

export const retrieveKeychainKey = (
  keychain: ConsumerKeychain | KnodeApiKeychain | ProducerKeychain,
  kid: KeyId,
) => {
  const key = keychain.keys.find((key) => key.kid === kid);

  if (!key) {
    throw keyNotFoundInKeychain(kid, keychain.id);
  }

  return key;
};

export const retrieveFlatProducerKeychain = async (
  producerKeychainId: ProducerKeychainId,
  readmodelService: ReadmodelService,
) => {
  const producerKeychain =
    await readmodelService.getFlatProducerKeychainById(producerKeychainId);

  if (!producerKeychain) {
    throw producerKeychainNotFound(producerKeychainId);
  }

  return producerKeychain;
};

export const retrieveProducerKeychain = async (
  producerKeychainId: ProducerKeychainId,
  readmodelService: ReadmodelService,
) => {
  const producerKeychain =
    await readmodelService.getProducerKeychainById(producerKeychainId);

  if (!producerKeychain) {
    throw producerKeychainNotFound(producerKeychainId);
  }

  return producerKeychain;
};

export const retrieveProducerKeychainEservice = async (
  producerKeychainEservice: Omit<ProducerKeychainEservice, "linkedAt">,
  readmodelService: ReadmodelService,
) => {
  const producerKeychainEserviceResult =
    await readmodelService.getProducerKeychainEservice(
      producerKeychainEservice,
    );

  if (!producerKeychainEserviceResult) {
    throw producerKeychainEserviceNotFound(
      producerKeychainEservice.producerKeychainId,
      producerKeychainEservice.eserviceId,
    );
  }

  return producerKeychainEserviceResult;
};

export async function retrieveKeychainMember<
  K extends ConsumerKeychain | KnodeApiKeychain | ProducerKeychain,
>({
  authData,
  cognitoIdmClient,
  keychain,
  userId,
}: {
  authData: UISessionAuthData;
  cognitoIdmClient: CognitoIdmClient;
  keychain: K;
  userId: UserId;
}): Promise<IdmUser> {
  assertOrganizationIsKeychainOwner(authData.organizationId, keychain);
  assertUserIsMemberOfKeychain(userId, keychain.id, keychain.users);

  const member = await cognitoIdmClient.getUserById(userId);
  if (!member) {
    throw keychainMemberNotFound(keychain.id, userId);
  }
  return member;
}

export async function retrievePaginatedKeychainUsers({
  cognitoIdmClient,
  paginationParams: { limit, offset },
  users,
}: {
  cognitoIdmClient: CognitoIdmClient;
  paginationParams: API_PaginationQueryParams;
  users: KeychainUser[];
}): Promise<ListResult<IdmUser>> {
  const sortedUsers = users.toSorted(
    (a, b) => b.addedAt.getTime() - a.addedAt.getTime(),
  );

  // TODO(KN-718): fetching every member before paginating in memory can put
  // significant load on the Cognito quotas for large keychains.
  const activeMembers = (
    await Promise.all(
      sortedUsers.map(({ userId }) => cognitoIdmClient.getUserById(userId)),
    )
  ).filter((member): member is IdmUser => member !== undefined);

  return {
    results: activeMembers.slice(offset, offset + limit),
    totalCount: activeMembers.length,
  };
}
