import type { bffApi } from "@knodia/bff-client";

// TODO: Currently only Active and Suspended are handled
export type ProducerAgreementState = Exclude<bffApi.AgreementState, "Archived">;
