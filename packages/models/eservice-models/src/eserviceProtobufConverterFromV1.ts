import type { AttributeGroup } from "@knodia/attribute-models";

import { fromOptionalExternalResource } from "@knodia/common-models/externalResource";
import { unsafeBrandId } from "@knodia/common-models/ids";
import { assertRequired } from "@knodia/common-models/utils";
import {
  PurposeFormAnswers,
  type PurposeFormSchemaVersion,
} from "@knodia/purpose-models";
import { match } from "ts-pattern";

import {
  type Eservice,
  EserviceAccessTokenType,
  type EserviceInterface,
  EserviceMode,
  type EserviceVersion,
  EserviceVersionState,
  type PurposeFormOption,
  type ReceiveDataConfig,
} from "./eservice.ts";
import {
  EserviceAccessTokenTypeV1,
  type EserviceInterfaceV1,
  EserviceModeV1,
  type EserviceV1,
  type EserviceVersionRequiredAttributeGroupV1,
  EserviceVersionStateV1,
  type EserviceVersionV1,
  type PurposeFormOptionV1,
  PurposeFormSchemaVersionV1,
  type ReceiveDataConfigV1,
} from "./generated/v1/eservice.ts";

export const fromEserviceV1 = (input: EserviceV1): Eservice => {
  assertRequired(input.name, "Eservice name is undefined");
  assertRequired(input.description, "Eservice description is undefined");

  return {
    ...input,
    createdAt: new Date(input.createdAt),
    description: input.description,
    id: unsafeBrandId(input.id),
    mode: fromEserviceModeV1(input.mode),
    name: input.name,
    producerId: unsafeBrandId(input.producerId),
    receiveDataConfig: input.receiveDataConfig
      ? fromReceiveDataConfigV1(input.receiveDataConfig)
      : undefined,
    template: fromOptionalExternalResource(input.template),
    updatedAt: new Date(input.updatedAt),
    versions: input.versions.map(fromEserviceVersionV1),
  };
};

const fromReceiveDataConfigV1 = (
  input: ReceiveDataConfigV1,
): ReceiveDataConfig => {
  if (input.purposeFormOptions.length === 0) {
    throw new Error(
      "ReceiveDataConfigV1.purposeFormOptions must contain at least one element",
    );
  }
  return {
    ...input,
    purposeFormOptions: input.purposeFormOptions.map(fromPurposeFormOptionV1),
  };
};

const fromPurposeFormOptionV1 = (
  input: PurposeFormOptionV1,
): PurposeFormOption => {
  assertRequired(input.name, "PurposeFormOption name is undefined");
  assertRequired(
    input.description,
    "PurposeFormOption description is undefined",
  );

  return {
    ...input,
    description: input.description,
    formAnswersJson: PurposeFormAnswers.parse(
      JSON.parse(input.formAnswersJson),
    ),
    formSchemaVersion: fromPurposeFormSchemaVersionV1(input.formSchemaVersion),
    id: unsafeBrandId(input.id),
    name: input.name,
  };
};

const fromPurposeFormSchemaVersionV1 = (
  input: PurposeFormSchemaVersionV1,
): PurposeFormSchemaVersion =>
  match(input)
    .with(PurposeFormSchemaVersionV1.V1_0, () => "1.0" as const)
    .with(PurposeFormSchemaVersionV1.UNRECOGNIZED, () => {
      throw new Error("Unrecognized PurposeFormSchemaVersionV1 value");
    })
    .exhaustive();

const fromEserviceModeV1 = (input: EserviceModeV1): EserviceMode =>
  match(input)
    .with(EserviceModeV1.PROVIDE_DATA, () => EserviceMode.enum.ProvideData)
    .with(EserviceModeV1.RECEIVE_DATA, () => EserviceMode.enum.ReceiveData)
    .with(EserviceModeV1.UNRECOGNIZED, () => {
      throw new Error("Unrecognized EserviceModeV1 value");
    })
    .exhaustive();

const fromEserviceVersionV1 = (input: EserviceVersionV1): EserviceVersion => {
  assertRequired(
    input.interfaceDocument,
    "EserviceVersion interfaceDocument is undefined",
  );

  return {
    ...input,
    accessTokenType: fromEserviceVersionAccessTokenTypeV1(
      input.accessTokenType,
    ),
    createdAt: new Date(input.createdAt),
    id: unsafeBrandId(input.id),
    interfaceDocument: fromEserviceVersionInterfaceV1(input.interfaceDocument),
    requiredAttributes: input.requiredAttributes.map(
      fromEserviceVersionRequiredAttributeGroupV1,
    ),
    state: fromEserviceVersionStateV1(input.state),
    updatedAt: new Date(input.updatedAt),
  };
};

const fromEserviceVersionRequiredAttributeGroupV1 = (
  input: EserviceVersionRequiredAttributeGroupV1,
): AttributeGroup => input.attributes;

const fromEserviceVersionAccessTokenTypeV1 = (
  input: EserviceAccessTokenTypeV1,
): EserviceAccessTokenType =>
  match(input)
    .with(
      EserviceAccessTokenTypeV1.BEARER,
      () => EserviceAccessTokenType.enum.Bearer,
    )
    .with(
      EserviceAccessTokenTypeV1.DPOP,
      () => EserviceAccessTokenType.enum.DPoP,
    )
    .with(EserviceAccessTokenTypeV1.UNRECOGNIZED, () => {
      throw new Error("Unrecognized EserviceAccessTokenTypeV1 value");
    })
    .exhaustive();

const fromEserviceVersionStateV1 = (
  input: EserviceVersionStateV1,
): EserviceVersionState =>
  match(input)
    .with(EserviceVersionStateV1.ACTIVE, () => EserviceVersionState.enum.Active)
    .with(
      EserviceVersionStateV1.SUSPENDED,
      () => EserviceVersionState.enum.Suspended,
    )
    .with(
      EserviceVersionStateV1.ARCHIVED,
      () => EserviceVersionState.enum.Archived,
    )
    .with(EserviceVersionStateV1.UNRECOGNIZED, () => {
      throw new Error("Unrecognized EserviceVersionStateV1 value");
    })
    .exhaustive();

const fromEserviceVersionInterfaceV1 = (
  input: EserviceInterfaceV1,
): EserviceInterface => {
  assertRequired(input.prettyName, "EserviceInterface prettyName is undefined");

  return {
    ...input,
    createdAt: new Date(input.createdAt),
    id: unsafeBrandId(input.id),
    prettyName: input.prettyName,
    updatedAt: new Date(input.updatedAt),
  };
};
