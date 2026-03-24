import { PurposeFormSchemaVersion } from "@knodia/purpose-models";
import { match } from "ts-pattern";

import schema_1_0 from "../schemas/1.0/schema.json" with { type: "json" };
import uischema_1_0 from "../schemas/1.0/uischema.json" with { type: "json" };

export const CURRENT_FORM_SCHEMA_VERSION: PurposeFormSchemaVersion =
  PurposeFormSchemaVersion.enum["1.0"];

export const getFormSchema = (version: PurposeFormSchemaVersion): unknown =>
  match(version)
    .with("1.0", () => schema_1_0)
    .exhaustive();

export const getFormUiSchema = (version: PurposeFormSchemaVersion): unknown =>
  match(version)
    .with("1.0", () => uischema_1_0)
    .exhaustive();
