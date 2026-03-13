import type { Agreement, AgreementState } from "@knodia/agreement-models";
import type { KnodeId } from "@knodia/common-models/ids";
import type {
  API_AccessTokenType,
  API_EserviceMode,
  API_EserviceVersionState,
} from "@knodia/eservice-models/api";
import type { k2kGatewayApi } from "@knodia/k2k-gateway-client";

import { match } from "ts-pattern";

export const toK2KVersionState = (
  state: API_EserviceVersionState,
): k2kGatewayApi.EserviceVersionState =>
  match(state)
    .with("Active", () => "ACTIVE" as const)
    .with("Suspended", () => "SUSPENDED" as const)
    .with("Archived", () => "ARCHIVED" as const)
    .exhaustive();

export const toK2KMode = (mode: API_EserviceMode): k2kGatewayApi.EserviceMode =>
  match(mode)
    .with("ProvideData", () => "PROVIDE_DATA" as const)
    .with("ReceiveData", () => "RECEIVE_DATA" as const)
    .exhaustive();

export const toK2KAccessTokenType = (
  tokenType: API_AccessTokenType,
): k2kGatewayApi.AccessTokenType =>
  match(tokenType)
    .with("Bearer", () => "BEARER" as const)
    .with("DPoP", () => "DPOP" as const)
    .exhaustive();

export const toK2KAgreement = (
  agreement: Agreement,
): k2kGatewayApi.Agreement => ({
  attributes: agreement.attributes,
  consumer: {
    id: agreement.consumer.id,
    knodeId: toK2KKnodeId(agreement.consumer.knodeId),
  },
  eserviceId: agreement.eserviceId,
  eserviceVersionId: agreement.eserviceVersionId,
  id: agreement.id,
  producerId: agreement.producerId,
  state: toK2KAgreementState(agreement.state),
  updatedAt: "",
});

const toK2KAgreementState = (
  state: AgreementState,
): k2kGatewayApi.AgreementState =>
  match(state)
    .with("Active", () => "ACTIVE" as const)
    .with("Suspended", () => "SUSPENDED" as const)
    .with("Archived", () => "ARCHIVED" as const)
    .exhaustive();

const toK2KKnodeId = (knodeId: KnodeId): k2kGatewayApi.KnodeId =>
  match(knodeId)
    .with("Orion", () => "ORION" as const)
    .with("Lynx", () => "LYNX" as const)
    .exhaustive();
