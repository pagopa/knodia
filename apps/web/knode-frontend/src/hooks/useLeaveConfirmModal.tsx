import { useState } from "react";

import { LeaveConfirmModal } from "@/components/LeaveConfirmModal";

interface Options {
  isDirty?: boolean;
  skipWhenClean?: boolean;
}

export const useLeaveConfirmModal = (
  onClose: () => void,
  { isDirty = false, skipWhenClean = false }: Options = {},
) => {
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const onModalShow = () => {
    if (skipWhenClean && !isDirty) {
      onClose();
      return;
    }
    setShowLeaveConfirm(true);
  };

  const handleConfirmLeave = () => {
    setShowLeaveConfirm(false);
    onClose();
  };

  const handleCancelLeave = () => setShowLeaveConfirm(false);

  return {
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
