import {
  AttributeId,
  EserviceId,
  EserviceInterfaceId,
  EserviceVersionId,
  OrganizationId,
} from "@knodia/common-models/ids";
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
  prettyName: z.string(),
  updatedAt: z.coerce.date(),
});
export type EserviceInterface = z.infer<typeof EserviceInterface>;

const EserviceVersion = z.strictObject({
  accessTokenAudience: z.array(z.string()),
  accessTokenDuration: z.number(),
  accessTokenType: EserviceAccessTokenType,
  attributeGroups: z.array(z.array(AttributeId)),
  createdAt: z.coerce.date(),
  id: EserviceVersionId,
  interfaceDocument: EserviceInterface,
  maxDailyCallsPerConsumer: z.number(),
  maxDailyCallsPerKnode: z.number(),
  state: EserviceVersionState,
  updatedAt: z.coerce.date(),
  versionNumber: z.int(),
});
export type EserviceVersion = z.infer<typeof EserviceVersion>;

const Eservice = z.strictObject({
  categories: z.array(z.string()),
  createdAt: z.coerce.date(),
  description: z.string(),
  id: EserviceId,
  isSignalHubEnabled: z.boolean(),
  mode: EserviceMode,
  name: z.string(),
  producerId: OrganizationId,
  updatedAt: z.coerce.date(),
  versions: z.array(EserviceVersion),
});
export type Eservice = z.infer<typeof Eservice>;
