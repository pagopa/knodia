import type { bffApi } from "@knodia/bff-client";
import type { EserviceId, KnodeId } from "@knodia/common-models/ids";

import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { CreatePurposeBlockedModal } from "../components/CreatePurposeBlockedModal";

interface Params {
  agreementState: bffApi.AgreementState;
  eserviceId: EserviceId;
  eserviceState: bffApi.EserviceVersionState;
  knodeId: KnodeId;
}

export function useCreatePurposeAction({
  agreementState,
  eserviceId,
  eserviceState,
  knodeId,
}: Params) {
  const navigate = useNavigate();
  const [isBlockedModalOpen, setIsBlockedModalOpen] = useState(false);
  const isBlocked =
    eserviceState === "Archived" || agreementState === "Archived";

  const onCreatePurposePress = () => {
    if (isBlocked) {
      setIsBlockedModalOpen(true);
      return;
    }
    navigate({
      params: { id: eserviceId },
      search: { knodeId },
      to: "/consumption/e-services/$id/purposes/new",
    });
  };

  const blockedModal = (
    <CreatePurposeBlockedModal
      agreementState={agreementState}
      eserviceState={eserviceState}
      isOpen={isBlockedModalOpen}
      onOpenChange={setIsBlockedModalOpen}
    />
  );

  return { blockedModal, isBlocked, onCreatePurposePress };
}
