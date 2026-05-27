import {
  API_KeyId,
  API_OrganizationId,
  API_Pagination,
  API_PaginationQueryParams,
  API_UserId,
} from "@knodia/common-models/api";
import { ExternalId } from "@knodia/common-models/externalResource";
import { type PurposeId } from "@knodia/common-models/ids";
import { API_KnodeId } from "@knodia/common-models/internalApi";
import {
  API_ConsumerKeychainIdPathParam,
  API_KeyAlgorithm,
  API_KeychainId,
  API_KeychainKeyLocalizedName,
  API_KeychainLocalizedDescription,
  API_KeychainLocalizedName,
  API_KeyFormat,
  API_KnodeApiKeychainIdPathParam,
  API_ProducerKeychainIdPathParam,
} from "@knodia/keychain-models/api";
import { z } from "zod";

export const API_Keychain = z
  .strictObject({
    createdAt: z.iso.datetime(),
    description: API_KeychainLocalizedDescription.optional(),
    id: API_KeychainId,
    name: API_KeychainLocalizedName,
    ownerId: API_OrganizationId,
    updatedAt: z.iso.datetime(),
  })
  .meta({ id: "Keychain" });
export type API_Keychain = z.infer<typeof API_Keychain>;

export const API_Keychains = z
  .strictObject({
    pagination: API_Pagination,
    results: z.array(API_Keychain),
  })
  .meta({ id: "Keychains" });
export type API_Keychains = z.infer<typeof API_Keychains>;

const API_GetConsumerKeychainsQueryPurposeFilter = z
  .string()
  .transform((v) => {
    const [knodeId, id] = v.split(":");
    return { id, knodeId };
  })
  .pipe(
    z.object({
      id: z.uuid(),
      knodeId: API_KnodeId,
    }),
  );

export const API_GetConsumerKeychainsQueryParams =
  API_PaginationQueryParams.extend({
    name: z.string().optional().meta({
      description: "Filter by Consumer Keychain name",
    }),
    ownerId: API_OrganizationId.optional().meta({
      description: "Filter by owner Organization ID",
    }),
    purpose: API_GetConsumerKeychainsQueryPurposeFilter.optional().meta({
      description:
        "Filter by Knode ID and Purpose ID. Format: {KnodeId}:{PurposeId} (e.g. Orion:00000000-0000-0000-0000-000000000000)",
    }),
  });
export type API_GetConsumerKeychainsQueryParams = z.infer<
  typeof API_GetConsumerKeychainsQueryParams
>;

export const API_GetConsumerKeychainKeysQueryParams = API_PaginationQueryParams;
export type API_GetConsumerKeychainKeysQueryParams = z.infer<
  typeof API_GetConsumerKeychainKeysQueryParams
>;

export const API_KeychainSeed = z
  .strictObject({
    description: API_KeychainLocalizedDescription.optional(),
    name: API_KeychainLocalizedName,
  })
  .meta({ id: "KeychainSeed" });
export type API_KeychainSeed = z.infer<typeof API_KeychainSeed>;

export const API_ConsumerKeychainPatch = z
  .strictObject({
    description: API_KeychainLocalizedDescription.nullable().optional(),
    name: API_KeychainLocalizedName.optional(),
  })
  .meta({ id: "ConsumerKeychainPatch" });
export type API_ConsumerKeychainPatch = z.infer<
  typeof API_ConsumerKeychainPatch
>;

export const API_KnodeApiKeychainPatch = z
  .strictObject({
    description: API_KeychainLocalizedDescription.nullable().optional(),
    name: API_KeychainLocalizedName.optional(),
  })
  .meta({ id: "KnodeApiKeychainPatch" });
export type API_KnodeApiKeychainPatch = z.infer<
  typeof API_KnodeApiKeychainPatch
>;

export const API_KeychainKeySeed = z
  .strictObject({
    encodedPem: z.string(),
    name: API_KeychainKeyLocalizedName,
  })
  .meta({ id: "KeychainKeySeed" });
export type API_KeychainKeySeed = z.infer<typeof API_KeychainKeySeed>;

export const API_KeychainKey = z
  .strictObject({
    algorithm: API_KeyAlgorithm,
    createdAt: z.iso.datetime(),
    encodedPem: z.string(),
    format: API_KeyFormat,
    kid: API_KeyId,
    name: API_KeychainKeyLocalizedName,
    userId: API_UserId,
  })
  .meta({ id: "KeychainKey" });
export type API_KeychainKey = z.infer<typeof API_KeychainKey>;

export const API_KeychainKeys = z
  .strictObject({
    pagination: API_Pagination,
    results: z.array(API_KeychainKey),
  })
  .meta({ id: "KeychainKeys" });
export type API_KeychainKeys = z.infer<typeof API_KeychainKeys>;

export const API_User = z
  .strictObject({
    email: z.string(),
    id: API_UserId,
    username: z.string(),
  })
  .meta({ id: "User" });
export type API_User = z.infer<typeof API_User>;

export const API_KeychainMemberSeed = z
  .strictObject({
    userId: API_UserId,
  })
  .meta({ id: "KeychainMemberSeed" });
export type API_KeychainMemberSeed = z.infer<typeof API_KeychainMemberSeed>;

export const API_ConsumerKeychainMemberPathParams = z
  .strictObject({
    userId: API_UserId,
  })
  .extend(API_ConsumerKeychainIdPathParam.shape);
export type API_ConsumerKeychainMemberPathParams = z.infer<
  typeof API_ConsumerKeychainMemberPathParams
>;

const API_ConsumerKeychainLinkedPurpose = z
  .strictObject({
    id: z.uuid(),
    knodeId: API_KnodeId,
  })
  .meta({ id: "ConsumerKeychainLinkedPurpose" });

export const API_ConsumerKeychainPurpose = z
  .strictObject({
    consumerKeychainId: API_KeychainId,
    linkedAt: z.iso.datetime(),
    purpose: API_ConsumerKeychainLinkedPurpose,
  })
  .meta({ id: "ConsumerKeychainPurpose" });
export type API_ConsumerKeychainPurpose = z.infer<
  typeof API_ConsumerKeychainPurpose
>;

export const API_ConsumerKeychainPurposes = z
  .strictObject({
    pagination: API_Pagination,
    results: z.array(API_ConsumerKeychainPurpose),
  })
  .meta({ id: "ConsumerKeychainPurposes" });
export type API_ConsumerKeychainPurposes = z.infer<
  typeof API_ConsumerKeychainPurposes
>;

export const API_GetConsumerKeychainPurposesQueryParams =
  API_PaginationQueryParams;
export type API_GetConsumerKeychainPurposesQueryParams = z.infer<
  typeof API_GetConsumerKeychainPurposesQueryParams
>;

export const API_ConsumerKeychainKeyPathParams = z
  .strictObject({
    keyId: z.string(),
  })
  .extend(API_ConsumerKeychainIdPathParam.shape);
export type API_ConsumerKeychainKeyPathParams = z.infer<
  typeof API_ConsumerKeychainKeyPathParams
>;

export const API_GetConsumerKeychainPurposePathParams =
  API_ConsumerKeychainIdPathParam.extend({
    purposeId: ExternalId<PurposeId>(),
  });
export type API_GetConsumerKeychainPurposePathParams = z.infer<
  typeof API_GetConsumerKeychainPurposePathParams
>;

export const API_GetConsumerKeychainPurposeQueryParams = z.strictObject({
  knodeId: API_KnodeId,
});
export type API_GetConsumerKeychainPurposeQueryParams = z.infer<
  typeof API_GetConsumerKeychainPurposeQueryParams
>;

export const API_GetConsumerKeychainMembersQueryParams =
  API_PaginationQueryParams;
export type API_GetConsumerKeychainMembersQueryParams = z.infer<
  typeof API_GetConsumerKeychainMembersQueryParams
>;

export const API_KeychainMembers = z
  .strictObject({
    pagination: API_Pagination,
    results: z.array(API_User),
  })
  .meta({ id: "KeychainMembers" });
export type API_KeychainMembers = z.infer<typeof API_KeychainMembers>;

export const API_KnodeApiKeychainKeyPathParams =
  API_KnodeApiKeychainIdPathParam.extend({
    keyId: z.string(),
  });
export type API_KnodeApiKeychainKeyPathParams = z.infer<
  typeof API_KnodeApiKeychainKeyPathParams
>;

export const API_KnodeApiKeychainMemberPathParams =
  API_KnodeApiKeychainIdPathParam.extend({
    userId: API_UserId,
  });
export type API_KnodeApiKeychainMemberPathParams = z.infer<
  typeof API_KnodeApiKeychainMemberPathParams
>;

export const API_GetKnodeApiKeychainMembersQueryParams =
  API_PaginationQueryParams;
export type API_GetKnodeApiKeychainMembersQueryParams = z.infer<
  typeof API_GetKnodeApiKeychainMembersQueryParams
>;

export const API_GetKnodeApiKeychainKeysQueryParams = API_PaginationQueryParams;
export type API_GetKnodeApiKeychainKeysQueryParams = z.infer<
  typeof API_GetKnodeApiKeychainKeysQueryParams
>;

export const API_GetKnodeApiKeychainsQueryParams =
  API_PaginationQueryParams.extend({
    name: z.string().optional().meta({
      description: "Filter by Knode API Keychain name",
    }),
    ownerId: API_OrganizationId.optional().meta({
      description: "Filter by owner Organization ID",
    }),
  });
export type API_GetKnodeApiKeychainsQueryParams = z.infer<
  typeof API_GetKnodeApiKeychainsQueryParams
>;

export const API_GetProducerKeychainsQueryParams =
  API_PaginationQueryParams.extend({
    eserviceId: z.uuid().optional().meta({
      description: "Filter by E-service ID",
    }),
    name: z.string().optional().meta({
      description: "Filter by Producer Keychain name",
    }),
    ownerId: API_OrganizationId.optional().meta({
      description: "Filter by owner Organization ID",
    }),
  });
export type API_GetProducerKeychainsQueryParams = z.infer<
  typeof API_GetProducerKeychainsQueryParams
>;

export const API_ProducerKeychainPatch = z
  .strictObject({
    description: API_KeychainLocalizedDescription.nullable().optional(),
    name: API_KeychainLocalizedName.optional(),
  })
  .meta({ id: "ProducerKeychainPatch" });
export type API_ProducerKeychainPatch = z.infer<
  typeof API_ProducerKeychainPatch
>;

export const API_ProducerKeychainMemberPathParams = z
  .strictObject({
    userId: API_UserId,
  })
  .extend(API_ProducerKeychainIdPathParam.shape);
export type API_ProducerKeychainMemberPathParams = z.infer<
  typeof API_ProducerKeychainMemberPathParams
>;

export const API_GetProducerKeychainMembersQueryParams =
  API_PaginationQueryParams;
export type API_GetProducerKeychainMembersQueryParams = z.infer<
  typeof API_GetProducerKeychainMembersQueryParams
>;
