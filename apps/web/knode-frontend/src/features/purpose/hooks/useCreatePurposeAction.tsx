import type { bffApi } from "@knodia/bff-client";

import { useState } from "react";

import { CreatePurposeBlockedModal } from "../components/CreatePurposeBlockedModal";

interface Params {
  agreementState: bffApi.AgreementState;
  eserviceState: bffApi.EserviceVersionState;
}

export function useCreatePurposeAction({
  agreementState,
  eserviceState,
}: Params) {
  const [isBlockedModalOpen, setIsBlockedModalOpen] = useState(false);
  const isBlocked =
    eserviceState === "Archived" ||
    agreementState === "Archived" ||
    agreementState === "PendingConsumerOperatorIdentification";

  const onBlockedPress = () => {
    setIsBlockedModalOpen(true);
  };

  const blockedModal = (
    <CreatePurposeBlockedModal
      agreementState={agreementState}
      eserviceState={eserviceState}
      isOpen={isBlockedModalOpen}
      onOpenChange={setIsBlockedModalOpen}
    />
  );

  return { blockedModal, isBlocked, onBlockedPress };
}
