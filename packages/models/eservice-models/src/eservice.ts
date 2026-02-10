import {
  EserviceId,
  EserviceInterfaceId,
  EserviceVersionId,
  OrganizationId,
} from "@knodia/common-models/ids";
import { LocalizedText } from "@knodia/common-models/localization";
import z from "zod";

const INT32_MAX = 2_147_483_647;

export const minAccessTokenDuration = 1;
export const maxAccessTokenDuration = 86400; // max 86400 seconds = 24 hours

export const minDailyCalls = 1;
export const maxDailyCalls = 1_000_000_000;

const minEserviceVersionNumber = 1;

export const EserviceMode = z.enum(["ProvideData", "ReceiveData"]);
export type EserviceMode = z.infer<typeof EserviceMode>;

export const EserviceAccessTokenType = z.enum(["Bearer", "DPoP"]);
export type EserviceAccessTokenType = z.infer<typeof EserviceAccessTokenType>;

export const EserviceVersionState = z.enum(["Active", "Suspended", "Archived"]);
export type EserviceVersionState = z.infer<typeof EserviceVersionState>;

export const EserviceInterface = z.strictObject({
  checksum: z.string(),
  contentType: z.string(),
  createdAt: z.coerce.date(),
  id: EserviceInterfaceId,
  name: z.string(),
  path: z.string(),
  prettyName: LocalizedText,
  updatedAt: z.coerce.date(),
});
export type EserviceInterface = z.infer<typeof EserviceInterface>;

const RequiredAttribute = z.strictObject({
  code: z.string(),
  scheme: z.string(),
});
export type RequiredAttribute = z.infer<typeof RequiredAttribute>;
const RequiredAttributeGroup = z.array(RequiredAttribute);
export type RequiredAttributeGroup = z.infer<typeof RequiredAttributeGroup>;

const EserviceVersion = z.strictObject({
  accessTokenAudience: z.array(z.string()),
  accessTokenDuration: z
    .int()
    .min(minAccessTokenDuration)
    .max(maxAccessTokenDuration),
  accessTokenType: EserviceAccessTokenType,
  createdAt: z.coerce.date(),
  id: EserviceVersionId,
  interfaceDocument: EserviceInterface,
  maxDailyCallsPerConsumer: z.int().min(minDailyCalls).max(maxDailyCalls),
  maxDailyCallsPerKnode: z.int().min(minDailyCalls).max(maxDailyCalls),
  requiredAttributes: z.array(RequiredAttributeGroup),
  state: EserviceVersionState,
  updatedAt: z.coerce.date(),
  versionNumber: z.int().min(minEserviceVersionNumber).max(INT32_MAX),
});
export type EserviceVersion = z.infer<typeof EserviceVersion>;

const EserviceCategory = z.strictObject({
  code: z.string(),
  scheme: z.string(),
});
export type EserviceCategory = z.infer<typeof EserviceCategory>;

export const Eservice = z.strictObject({
  categories: z.array(EserviceCategory),
  createdAt: z.coerce.date(),
  description: LocalizedText,
  id: EserviceId,
  isConsumerOperatorIdentificationRequired: z.boolean(),
  isSignalHubEnabled: z.boolean(),
  mode: EserviceMode,
  name: LocalizedText,
  producerId: OrganizationId,
  updatedAt: z.coerce.date(),
  versions: z.array(EserviceVersion),
});
export type Eservice = z.infer<typeof Eservice>;
