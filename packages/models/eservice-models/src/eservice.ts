import { AttributeGroup } from "@knodia/attribute-models";
import { CategoryId } from "@knodia/category-models";
import { ExternalResource } from "@knodia/common-models/externalResource";
import {
  EserviceId,
  EserviceInterfaceId,
  type EserviceTemplateId,
  EserviceVersionId,
  OrganizationId,
  PurposeFormOptionId,
} from "@knodia/common-models/ids";
import { LocalizedText } from "@knodia/common-models/localization";
import {
  PurposeFormAnswers,
  PurposeFormSchemaVersion,
} from "@knodia/purpose-models";
import z from "zod";

const INT32_MAX = 2_147_483_647;

export const minAccessTokenDuration = 1;
export const maxAccessTokenDuration = 86400; // max 86400 seconds = 24 hours

export const minDailyCalls = 1;
export const maxDailyCalls = 1_000_000_000;

const minEserviceVersionNumber = 1;

export const maxDescriptionLength = 250;
export const minDescriptionLength = 10;

export const maxNameLength = 60;
export const minNameLength = 5;

export const LocalizedDescription = LocalizedText(
  minDescriptionLength,
  maxDescriptionLength,
);
export type LocalizedDescription = z.infer<typeof LocalizedDescription>;

export const LocalizedName = LocalizedText(minNameLength, maxNameLength);
export type LocalizedName = z.infer<typeof LocalizedName>;

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
  prettyName: LocalizedName,
  updatedAt: z.coerce.date(),
});
export type EserviceInterface = z.infer<typeof EserviceInterface>;

// Knodia e-service interface documents must be OpenAPI specs.
export const EserviceInterfaceAllowedFileType = z.enum(["json", "yaml", "yml"]);
export type EserviceInterfaceAllowedFileType = z.infer<
  typeof EserviceInterfaceAllowedFileType
>;

/** Returns the interface file type derived from the name extension, or undefined if unsupported. */
export function getEserviceInterfaceFileType(
  fileName: string,
): EserviceInterfaceAllowedFileType | undefined {
  const extension = fileName.split(".").pop()?.toLowerCase();
  return EserviceInterfaceAllowedFileType.safeParse(extension).data;
}

export const EserviceVersion = z.strictObject({
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
  requiredAttributes: z.array(AttributeGroup).min(1),
  state: EserviceVersionState,
  updatedAt: z.coerce.date(),
  versionNumber: z.int().min(minEserviceVersionNumber).max(INT32_MAX),
});
export type EserviceVersion = z.infer<typeof EserviceVersion>;

export const PurposeFormOption = z.strictObject({
  description: LocalizedDescription,
  formAnswersJson: PurposeFormAnswers,
  formSchemaVersion: PurposeFormSchemaVersion,
  id: PurposeFormOptionId,
  name: LocalizedName,
});
export type PurposeFormOption = z.infer<typeof PurposeFormOption>;

export const ReceiveDataConfig = z.strictObject({
  purposeFormOptions: z.array(PurposeFormOption).min(1),
});
export type ReceiveDataConfig = z.infer<typeof ReceiveDataConfig>;

export const Eservice = z.strictObject({
  categories: z.array(CategoryId),
  createdAt: z.coerce.date(),
  description: LocalizedDescription,
  id: EserviceId,
  isConsumerOperatorIdentificationRequired: z.boolean(),
  isSignalHubEnabled: z.boolean(),
  mode: EserviceMode,
  name: LocalizedName,
  producerId: OrganizationId,
  receiveDataConfig: ReceiveDataConfig.optional(),
  template: ExternalResource<EserviceTemplateId>().optional(), // present only if the eservice is created from a template
  updatedAt: z.coerce.date(),
  versions: z.array(EserviceVersion),
});
export type Eservice = z.infer<typeof Eservice>;

export const FlatEservice = Eservice.omit({
  receiveDataConfig: true,
  versions: true,
});
export type FlatEservice = z.infer<typeof FlatEservice>;
