import type { RequiredAttributeGroup } from "@knodia/attribute-models";

import { unsafeBrandId } from "@knodia/common-models/ids";
import { assertRequired } from "@knodia/common-models/utils";
import { match } from "ts-pattern";

import {
  type Eservice,
  EserviceAccessTokenType,
  EserviceInterface,
  EserviceMode,
  type EserviceVersion,
  EserviceVersionState,
} from "./eservice.ts";
import {
  EserviceAccessTokenTypeV1,
  EserviceInterfaceV1,
  EserviceModeV1,
  type EserviceV1,
  EserviceVersionRequiredAttributeGroupV1,
  EserviceVersionStateV1,
  EserviceVersionV1,
} from "./generated/v1/eservice.ts";

export const fromEserviceV1 = (input: EserviceV1): Eservice => {
  assertRequired(input.description, "Eservice description");
  assertRequired(input.name, "Eservice name");

  return {
    ...input,
    createdAt: new Date(input.createdAt),
    description: input.description,
    id: unsafeBrandId(input.id),
    mode: fromEserviceModeV1(input.mode),
    name: input.name,
    producerId: unsafeBrandId(input.producerId),
    updatedAt: new Date(input.updatedAt),
    versions: input.versions.map(fromEserviceVersionV1),
  };
};

const fromEserviceModeV1 = (input: EserviceModeV1): EserviceMode =>
  match(input)
    .with(EserviceModeV1.PROVIDE_DATA, () => EserviceMode.enum.ProvideData)
    .with(EserviceModeV1.RECEIVE_DATA, () => EserviceMode.enum.ReceiveData)
    .with(EserviceModeV1.UNRECOGNIZED, () => {
      throw new Error("Unrecognized EserviceModeV1 value");
    })
    .exhaustive();

const fromEserviceVersionV1 = (input: EserviceVersionV1): EserviceVersion => {
  assertRequired(input.interfaceDocument, "EserviceVersion interfaceDocument");

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
): RequiredAttributeGroup => input.attributes;

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
  assertRequired(input.prettyName, "EserviceInterface prettyName");

  return {
    ...input,
    createdAt: new Date(input.createdAt),
    id: unsafeBrandId(input.id),
    prettyName: input.prettyName,
    updatedAt: new Date(input.updatedAt),
  };
};
