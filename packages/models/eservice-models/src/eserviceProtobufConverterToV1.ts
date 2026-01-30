import { match } from "ts-pattern";

import type {
  Eservice,
  EserviceAccessTokenType,
  EserviceInterface,
  EserviceMode,
  EserviceVersion,
  EserviceVersionState,
  RequiredAttributeGroup,
} from "./eservice.ts";

import {
  EserviceAccessTokenTypeV1,
  type EserviceInterfaceV1,
  EserviceModeV1,
  type EserviceV1,
  type EserviceVersionRequiredAttributeGroupV1,
  EserviceVersionStateV1,
  type EserviceVersionV1,
} from "./generated/v1/eservice.ts";

const toEserviceModeV1 = (mode: EserviceMode): EserviceModeV1 =>
  match(mode)
    .with("ProvideData", () => EserviceModeV1.PROVIDE_DATA)
    .with("ReceiveData", () => EserviceModeV1.RECEIVE_DATA)
    .exhaustive();

const toEserviceAccessTokenTypeV1 = (
  accessTokenType: EserviceAccessTokenType,
): EserviceAccessTokenTypeV1 =>
  match(accessTokenType)
    .with("Bearer", () => EserviceAccessTokenTypeV1.BEARER)
    .with("DPoP", () => EserviceAccessTokenTypeV1.DPOP)
    .exhaustive();

const toEserviceVersionStateV1 = (
  state: EserviceVersionState,
): EserviceVersionStateV1 =>
  match(state)
    .with("Active", () => EserviceVersionStateV1.ACTIVE)
    .with("Suspended", () => EserviceVersionStateV1.SUSPENDED)
    .with("Archived", () => EserviceVersionStateV1.ARCHIVED)
    .exhaustive();

const toEserviceVersionRequiredAttributeGroupV1 = (
  group: RequiredAttributeGroup,
  index: number,
): EserviceVersionRequiredAttributeGroupV1 => ({
  attributes: group,
  groupId: index,
});

const toEserviceInterfaceV1 = (
  eserviceInterface: EserviceInterface,
): EserviceInterfaceV1 => ({
  ...eserviceInterface,
  createdAt: eserviceInterface.createdAt.getTime().toString(),
  updatedAt: eserviceInterface.updatedAt.getTime().toString(),
});

const toEserviceVersionV1 = (version: EserviceVersion): EserviceVersionV1 => ({
  ...version,
  accessTokenType: toEserviceAccessTokenTypeV1(version.accessTokenType),
  createdAt: version.createdAt.getTime(),
  interfaceDocument: toEserviceInterfaceV1(version.interfaceDocument),
  requiredAttributes: version.requiredAttributes.map(
    toEserviceVersionRequiredAttributeGroupV1,
  ),
  state: toEserviceVersionStateV1(version.state),
  updatedAt: version.updatedAt.getTime(),
});

export const toEserviceV1 = (eservice: Eservice): EserviceV1 => ({
  ...eservice,
  createdAt: eservice.createdAt.getTime(),
  mode: toEserviceModeV1(eservice.mode),
  updatedAt: eservice.updatedAt.getTime(),
  versions: eservice.versions.map(toEserviceVersionV1),
});
