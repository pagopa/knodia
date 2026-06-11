import { useState } from "react";

import { LeaveConfirmModal } from "@/components/LeaveConfirmModal";

interface Options {
  skipWhenClean?: boolean;
}

export const useLeaveConfirmModal = (
  onClose: () => void,
  { skipWhenClean = false }: Options = {},
) => {
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const onModalShow = () => {
    if (skipWhenClean && !isDirty) {
      onClose();
      return;
    }
    setShowLeaveConfirm(true);
  };

  const markDirty = () => setIsDirty(true);

  const handleConfirmLeave = () => {
    setShowLeaveConfirm(false);
    onClose();
  };

  const handleCancelLeave = () => setShowLeaveConfirm(false);

  return {
    markDirty,
    modal: (
      <LeaveConfirmModal
        isOpen={showLeaveConfirm}
        onCancel={handleCancelLeave}
        onConfirm={handleConfirmLeave}
      />
    ),
    onModalShow,
    showLeaveConfirm,
  };
};
