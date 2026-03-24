import { type PurposeFormSchemaVersion } from "@knodia/purpose-models";
import { match } from "ts-pattern";

import schema_1_0 from "../schemas/1.0/schema.json" with { type: "json" };
import uischema_1_0 from "../schemas/1.0/uischema.json" with { type: "json" };

export const getFormSchema = (
  version: PurposeFormSchemaVersion,
): Record<string, unknown> =>
  match(version)
    .with("1.0", () => schema_1_0)
    .exhaustive();

export const getFormUiSchema = (
  version: PurposeFormSchemaVersion,
): Record<string, unknown> =>
  match(version)
    .with("1.0", () => uischema_1_0)
    .exhaustive();
