import { ExternalResource } from "@knodia/common-models/externalResource";
import {
  EserviceId,
  type OrganizationId,
  PurposeId,
} from "@knodia/common-models/ids";
import { LocalizedText } from "@knodia/common-models/localization";
import z from "zod";

export const minNameLength = 5;
export const maxNameLength = 60;

export const minDescriptionLength = 10;
export const maxDescriptionLength = 250;

export const minDailyCalls = 0;
export const maxDailyCalls = 1_000_000_000;

export const LocalizedPurposeName = LocalizedText(minNameLength, maxNameLength);
export type LocalizedPurposeName = z.infer<typeof LocalizedPurposeName>;

export const LocalizedPurposeDescription = LocalizedText(
  minDescriptionLength,
  maxDescriptionLength,
);
export type LocalizedPurposeDescription = z.infer<
  typeof LocalizedPurposeDescription
>;

export const PurposeState = z.enum(["Active", "Suspended", "Archived"]);
export type PurposeState = z.infer<typeof PurposeState>;

// Generic key-value pairs for form answers (serialized as JSON string in protobuf),
// validated at runtime based on the JSON schema form of the Knode
export const PurposeFormAnswers = z.record(z.string(), z.unknown());
export type PurposeFormAnswers = z.infer<typeof PurposeFormAnswers>;

export const PurposeFormSchemaVersion = z.enum(["1.0"]);
export type PurposeFormSchemaVersion = z.infer<typeof PurposeFormSchemaVersion>;

export const Purpose = z.strictObject({
  consumer: ExternalResource<OrganizationId>(),
  createdAt: z.coerce.date(),
  dailyCalls: z.int().min(minDailyCalls).max(maxDailyCalls),
  description: LocalizedPurposeDescription,
  eserviceId: EserviceId,
  formAnswersJson: PurposeFormAnswers,
  formSchemaVersion: PurposeFormSchemaVersion,
  id: PurposeId,
  name: LocalizedPurposeName,
  state: PurposeState,
  updatedAt: z.coerce.date(),
});
export type Purpose = z.infer<typeof Purpose>;
