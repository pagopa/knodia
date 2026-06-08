import {
  API_KeyId,
  API_Pagination,
  API_PaginationQueryParams,
  API_UserId,
} from "@knodia/common-models/api";
import { API_KnodeId } from "@knodia/common-models/internalApi";
import {
  API_ConsumerKeychainIdPathParam,
  API_KeychainKeyLocalizedName,
  API_KeychainLocalizedDescription,
  API_KeychainLocalizedName,
  API_KnodeApiKeychainIdPathParam,
} from "@knodia/keychain-models/api";
import { API_CompactOrganization } from "@knodia/organization-models/api";
import {
  API_LocalizedPurposeName,
  API_PurposeState,
} from "@knodia/purpose-models/api";
import z from "zod";

import { API_CompactEservice } from "../eservice/api.ts";

export const API_KeychainSeed = z
  .strictObject({
    description: API_KeychainLocalizedDescription.optional(),
    name: API_KeychainLocalizedName,
  })
  .meta({ id: "KeychainSeed" });
export type API_KeychainSeed = z.infer<typeof API_KeychainSeed>;

export const API_KnodeApiKeychainsQueryParams = API_PaginationQueryParams;
export type API_KnodeApiKeychainsQueryParams = z.infer<
  typeof API_KnodeApiKeychainsQueryParams
>;

export const API_Keychain = z
  .strictObject({
    id: z.uuid(),
    keysCount: z.number().int().min(0).meta({ format: "int32" }),
    membersCount: z.number().int().min(0).meta({ format: "int32" }),
    name: API_KeychainLocalizedName,
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

export const API_KeychainDetails = z
  .strictObject({
    createdAt: z.iso.datetime(),
    description: API_KeychainLocalizedDescription.optional(),
    id: z.uuid(),
    name: API_KeychainLocalizedName,
    updatedAt: z.iso.datetime(),
  })
  .meta({ id: "KeychainDetails" });
export type API_KeychainDetails = z.infer<typeof API_KeychainDetails>;

export const API_ProducerKeychainsQueryParams = API_PaginationQueryParams;
export type API_ProducerKeychainsQueryParams = z.infer<
  typeof API_ProducerKeychainsQueryParams
>;

export const API_ConsumerKeychainsQueryParams =
  API_PaginationQueryParams.extend({
    eserviceId: z.uuid().optional().meta({
      description:
        "Filter by E-service ID. Returns Consumer Keychains linked to any Active or Suspended Purpose belonging to the given E-service. Mutually exclusive with `purpose`.",
    }),
    purpose: z
      .string()
      .refine((value) => {
        const [knodeId, id, ...rest] = value.split(":");

        return (
          rest.length === 0 &&
          API_KnodeId.safeParse(knodeId).success &&
          z.uuid().safeParse(id).success
        );
      })
      .optional()
      .meta({
        description:
          "Filter by Knode ID and Purpose ID. Format: {KnodeId}:{PurposeId} (e.g. Orion:00000000-0000-0000-0000-000000000000). Mutually exclusive with `eserviceId`.",
      }),
  }).refine((q) => !(q.purpose && q.eserviceId), {
    message: "`purpose` and `eserviceId` are mutually exclusive",
  });
export type API_ConsumerKeychainsQueryParams = z.infer<
  typeof API_ConsumerKeychainsQueryParams
>;

export const API_GetConsumerKeychainOptionsQueryParams =
  API_PaginationQueryParams.extend({
    q: z.string().meta({
      description: "Search text used to filter Consumer Keychains by name",
    }),
  });
export type API_GetConsumerKeychainOptionsQueryParams = z.infer<
  typeof API_GetConsumerKeychainOptionsQueryParams
>;

export const API_ConsumerKeychainOption = z
  .strictObject({
    id: z.uuid(),
    name: API_KeychainLocalizedName,
  })
  .meta({ id: "ConsumerKeychainOption" });
export type API_ConsumerKeychainOption = z.infer<
  typeof API_ConsumerKeychainOption
>;

export const API_ConsumerKeychainOptions = z
  .strictObject({
    pagination: API_Pagination,
    results: z.array(API_ConsumerKeychainOption),
  })
  .meta({ id: "ConsumerKeychainOptions" });
export type API_ConsumerKeychainOptions = z.infer<
  typeof API_ConsumerKeychainOptions
>;

export const API_GetConsumerKeychainKeysQueryParams = API_PaginationQueryParams;
export type API_GetConsumerKeychainKeysQueryParams = z.infer<
  typeof API_GetConsumerKeychainKeysQueryParams
>;

export const API_GetConsumerKeychainMembersQueryParams =
  API_PaginationQueryParams;
export type API_GetConsumerKeychainMembersQueryParams = z.infer<
  typeof API_GetConsumerKeychainMembersQueryParams
>;

export const API_GetConsumerKeychainPurposesQueryParams =
  API_PaginationQueryParams;
export type API_GetConsumerKeychainPurposesQueryParams = z.infer<
  typeof API_GetConsumerKeychainPurposesQueryParams
>;

const API_PurposeId = z.uuid().meta({
  description: "Unique identifier of the Purpose",
  id: "PurposeId",
});

export const API_ConsumerKeychainPurpose = z
  .strictObject({
    eservice: API_CompactEservice,
    id: API_PurposeId,
    name: API_LocalizedPurposeName,
    producer: API_CompactOrganization,
    state: API_PurposeState,
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

export const API_KeychainPatch = z
  .strictObject({
    description: API_KeychainLocalizedDescription.nullable().optional(),
    name: API_KeychainLocalizedName.optional(),
  })
  .meta({ id: "KeychainPatch" });
export type API_KeychainPatch = z.infer<typeof API_KeychainPatch>;

export const API_GetKnodeApiKeychainKeysQueryParams = API_PaginationQueryParams;
export type API_GetKnodeApiKeychainKeysQueryParams = z.infer<
  typeof API_GetKnodeApiKeychainKeysQueryParams
>;

export const API_GetKnodeApiKeychainMembersQueryParams =
  API_PaginationQueryParams;
export type API_GetKnodeApiKeychainMembersQueryParams = z.infer<
  typeof API_GetKnodeApiKeychainMembersQueryParams
>;

export const API_KnodeApiKeychainMemberPathParams = z
  .strictObject({
    userId: API_UserId,
  })
  .extend(API_KnodeApiKeychainIdPathParam.shape);

export type API_KnodeApiKeychainMemberPathParams = z.infer<
  typeof API_KnodeApiKeychainMemberPathParams
>;

export const API_KnodeApiKeychainKeyPathParams = z
  .strictObject({
    keyId: API_KeyId,
  })
  .extend(API_KnodeApiKeychainIdPathParam.shape);

export type API_KnodeApiKeychainKeyPathParams = z.infer<
  typeof API_KnodeApiKeychainKeyPathParams
>;

export const API_KnodeApiKeychainMembershipCheckResult = z
  .strictObject({
    isMember: z.boolean(),
  })
  .meta({ id: "KnodeApiKeychainMembershipCheckResult" });
export type API_KnodeApiKeychainMembershipCheckResult = z.infer<
  typeof API_KnodeApiKeychainMembershipCheckResult
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
    createdAt: z.iso.datetime(),
    kid: API_KeyId,
    name: API_KeychainKeyLocalizedName,
    uploaderUsername: z.string().optional(),
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

export const API_KeychainMemberSeed = z
  .strictObject({
    userId: API_UserId,
  })
  .meta({ id: "KeychainMemberSeed" });
export type API_KeychainMemberSeed = z.infer<typeof API_KeychainMemberSeed>;

export const API_ConsumerKeychainMembershipCheckResult = z
  .strictObject({
    isMember: z.boolean(),
  })
  .meta({ id: "ConsumerKeychainMembershipCheckResult" });
export type API_ConsumerKeychainMembershipCheckResult = z.infer<
  typeof API_ConsumerKeychainMembershipCheckResult
>;

export const API_ConsumerKeychainPurposeLinkCheckResult = z
  .strictObject({
    isLinked: z.boolean(),
  })
  .meta({ id: "ConsumerKeychainPurposeLinkCheckResult" });
export type API_ConsumerKeychainPurposeLinkCheckResult = z.infer<
  typeof API_ConsumerKeychainPurposeLinkCheckResult
>;

export const API_ConsumerKeychainMemberPathParams = z
  .strictObject({
    userId: API_UserId,
  })
  .extend(API_ConsumerKeychainIdPathParam.shape);

export type API_ConsumerKeychainMemberPathParams = z.infer<
  typeof API_ConsumerKeychainMemberPathParams
>;

export const API_ConsumerKeychainKeyPathParams = z
  .strictObject({
    keyId: API_KeyId,
  })
  .extend(API_ConsumerKeychainIdPathParam.shape);

export type API_ConsumerKeychainKeyPathParams = z.infer<
  typeof API_ConsumerKeychainKeyPathParams
>;

export const API_User = z
  .strictObject({
    email: z.string(),
    id: API_UserId,
    username: z.string(),
  })
  .meta({ id: "User" });
export type API_User = z.infer<typeof API_User>;

export const API_KeychainMembers = z
  .strictObject({
    pagination: API_Pagination,
    results: z.array(API_User),
  })
  .meta({ id: "KeychainMembers" });
export type API_KeychainMembers = z.infer<typeof API_KeychainMembers>;

export const API_CreatedKeyResource = z
  .strictObject({
    kid: API_KeyId,
  })
  .meta({
    description: "Unique JWK identifier (kid) of the created key",
    id: "CreatedKeyResource",
  });

export type API_CreatedKeyResource = z.infer<typeof API_CreatedKeyResource>;
