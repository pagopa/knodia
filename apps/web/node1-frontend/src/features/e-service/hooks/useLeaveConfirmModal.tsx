import { useState } from "react";

import { LeaveConfirmModal } from "../components/CreateEServiceModal/LeaveConfirmModal";

export const useLeaveConfirmModal = (onClose: () => void) => {
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const onModalShow = () => setShowLeaveConfirm(true);

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
