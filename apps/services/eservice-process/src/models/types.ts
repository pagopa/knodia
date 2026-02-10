import type { Eservice, EserviceVersionState } from "@knodia/eservice-models";

export type ProducerEservice = Eservice & {
  activeAgreements: number;
  activePurposes: number;
  status: EserviceVersionState;
};
