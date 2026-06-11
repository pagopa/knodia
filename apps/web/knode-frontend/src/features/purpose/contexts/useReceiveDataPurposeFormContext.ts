import type { bffApi } from "@knodia/bff-client";
import type { KnodeId } from "@knodia/common-models/ids";

import { createContext, useContext } from "react";

import type { ConsumptionEserviceDetail } from "@/features/e-service/models/consumption-eservice-detail";
import type {
  DetailsStepData,
  PurposeFormDraftData,
} from "@/features/purpose/types/purposeCreateForm";

export interface ReceiveDataPurposeWizardContextValue {
  data: PurposeFormDraftData;
  eservice: ConsumptionEserviceDetail;
  knodeId: KnodeId;
  onDirty?: () => void;
  purposeFormOptions: bffApi.ConsumerPurposeFormOption[];
  selectedPurposeFormOptionId: null | string;
  selectPurposeFormOption: (id: string) => void;
  updateDetailsStep: (data: DetailsStepData) => void;
}

export const ReceiveDataPurposeWizardContext =
  createContext<null | ReceiveDataPurposeWizardContextValue>(null);

export function useReceiveDataPurposeWizardContext() {
  const context = useContext(ReceiveDataPurposeWizardContext);
  if (!context) {
    throw new Error(
      "useReceiveDataPurposeWizardContext must be used within a ReceiveDataPurposeFormProvider",
    );
  }
  return context;
}
