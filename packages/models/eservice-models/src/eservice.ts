import {
  EserviceId,
  EserviceInterfaceId,
  EserviceVersionId,
  OrganizationId,
} from "@knodia/common-models/ids";
import { LocalizedText } from "@knodia/common-models/localization";
import z from "zod";

const EserviceMode = z.enum(["ProvideData", "ReceiveData"]);
export type EserviceMode = z.infer<typeof EserviceMode>;

const EserviceAccessTokenType = z.enum(["Bearer", "DPoP"]);
export type EserviceAccessTokenType = z.infer<typeof EserviceAccessTokenType>;

const EserviceVersionState = z.enum(["Active", "Suspended", "Archived"]);
export type EserviceVersionState = z.infer<typeof EserviceVersionState>;

const EserviceInterface = z.strictObject({
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

const EserviceVersion = z.strictObject({
  accessTokenAudience: z.array(z.string()),
  accessTokenDuration: z.number().max(86400), // max 86400 seconds = 24 hours
  accessTokenType: EserviceAccessTokenType,
  createdAt: z.coerce.date(),
  id: EserviceVersionId,
  interfaceDocument: EserviceInterface,
  maxDailyCallsPerConsumer: z.number(),
  maxDailyCallsPerKnode: z.number(),
  requiredAttributes: z.array(RequiredAttributeGroup),
  state: EserviceVersionState,
  updatedAt: z.coerce.date(),
  versionNumber: z.int(),
});
export type EserviceVersion = z.infer<typeof EserviceVersion>;

const EserviceCategory = z.strictObject({
  code: z.string(),
  scheme: z.string(),
});
export type EserviceCategory = z.infer<typeof EserviceCategory>;

const Eservice = z.strictObject({
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
