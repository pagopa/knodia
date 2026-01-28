import { brandId } from "@knodia/common-models/ids";
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
  EserviceVersionStateV1,
  EserviceVersionV1,
} from "./generated/v1/eservice.js";

export const fromEserviceV1 = (input: EserviceV1): Eservice => ({
  ...input,
  createdAt: new Date(input.createdAt),
  description: throwIfMissing(
    input.description,
    "Eservice description is undefined",
  ),
  id: brandId(input.id),
  mode: fromEserviceModeV1(input.mode),
  name: throwIfMissing(input.name, "Eservice name is undefined"),
  producerId: brandId(input.producerId),
  updatedAt: new Date(input.updatedAt),
  versions: input.versions.map(fromEserviceVersionV1),
});

export const throwIfMissing = <T, R = T>(
  value: T | undefined,
  message: string,
  converter?: (value: T) => R,
): R => {
  if (value === undefined) {
    throw new Error(message);
  }
  return converter ? converter(value) : (value as unknown as R);
};

export const fromEserviceModeV1 = (input: EserviceModeV1): EserviceMode =>
  match(input)
    .with(EserviceModeV1.PROVIDE_DATA, () => EserviceMode.enum.ProvideData)
    .with(EserviceModeV1.RECEIVE_DATA, () => EserviceMode.enum.ReceiveData)
    .with(EserviceModeV1.UNRECOGNIZED, () => {
      throw new Error("Unrecognized EserviceModeV1 value");
    })
    .exhaustive();

export const fromEserviceVersionV1 = (
  input: EserviceVersionV1,
): EserviceVersion => ({
  ...input,
  accessTokenType: fromEserviceVersionAccessTokenTypeV1(input.accessTokenType),
  createdAt: new Date(input.createdAt),
  id: brandId(input.id),
  interfaceDocument: throwIfMissing(
    input.interfaceDocument,
    "EserviceVersion interfaceDocument is undefined",
    fromEserviceVersionInterfaceV1,
  ),
  // TODO: convert
  requiredAttributes: [],
  state: fromEserviceVersionStateV1(input.state),
  updatedAt: new Date(input.updatedAt),
});

export const fromEserviceVersionAccessTokenTypeV1 = (
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

export const fromEserviceVersionStateV1 = (
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

export const fromEserviceVersionInterfaceV1 = (
  input: EserviceInterfaceV1,
): EserviceInterface => ({
  ...input,
  createdAt: new Date(input.createdAt),
  id: brandId(input.id),
  prettyName: throwIfMissing(
    input.prettyName,
    "EserviceInterface prettyName is undefined",
  ),
  updatedAt: new Date(input.updatedAt),
});
