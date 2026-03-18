import { ExternalResource } from "@knodia/common-models/externalResource";
import {
  EserviceId,
  OrganizationId,
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

const LocalizedName = LocalizedText(minNameLength, maxNameLength);
type LocalizedName = z.infer<typeof LocalizedName>;

const LocalizedDescription = LocalizedText(
  minDescriptionLength,
  maxDescriptionLength,
);
type LocalizedDescription = z.infer<typeof LocalizedDescription>;

export const PurposeState = z.enum(["Active", "Suspended", "Archived"]);
export type PurposeState = z.infer<typeof PurposeState>;

export const Purpose = z.strictObject({
  consumer: ExternalResource<OrganizationId>(),
  createdAt: z.coerce.date(),
  dailyCalls: z.int().min(minDailyCalls).max(maxDailyCalls),
  description: LocalizedDescription,
  eserviceId: EserviceId,
  formAnswers: z.record(z.string(), z.unknown()),
  // ^ generic key-value pairs for form answers,
  // validated at runtime based on the JSON schema form of the Knode
  id: PurposeId,
  name: LocalizedName,
  state: PurposeState,
  updatedAt: z.coerce.date(),
});
export type Purpose = z.infer<typeof Purpose>;
