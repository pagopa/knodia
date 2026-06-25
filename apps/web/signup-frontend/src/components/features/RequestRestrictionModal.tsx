import { type signupManagerApi } from "@knodia/signup-manager-client";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

import { Modal, Radio, RadioGroup } from "@/components/ui";
import { useNavigateAfterSignupChange } from "@/hooks/useNavigateAfterSignupChange";
import { GENERIC_ERROR_MESSAGE } from "@/services/messages";
import { suspendUserMutationOptions } from "@/services/queries";

type SuspensionReason =
  signupManagerApi.SuspendUserRequestBody["suspensionReason"];

const RESTRICTION_REASONS = [
  {
    label:
      "I believe my data is inaccurate and I want to challenge it – Art. 18.1.(a)",
    value: "ACCURACY_CONTESTED",
  },
  {
    label:
      "My data was processed unlawfully, but I prefer restriction to erasure – Art. 18.1.(b)",
    value: "UNLAWFUL_PROCESSING",
  },
  {
    label:
      "You no longer need my data, but I need it for a legal claim – Art. 18.1.(c)",
    value: "DATA_NEEDED_FOR_LEGAL_CLAIMS",
  },
  {
    label:
      "I have objected to processing under Art. 21 and I am waiting verification – Art. 18.1.(d)",
    value: "PENDING_OBJECTION_VERIFICATION",
  },
] as const satisfies readonly { label: string; value: SuspensionReason }[];

const DEFAULT_REASON = RESTRICTION_REASONS[0].value;

interface RequestRestrictionDialogProps {
  onOpenChange: (isOpen: boolean) => void;
}

interface RequestRestrictionModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function RequestRestrictionModal({
  isOpen,
  onOpenChange,
}: RequestRestrictionModalProps) {
  if (!isOpen) return null;

  return <RequestRestrictionDialog onOpenChange={onOpenChange} />;
}

function RequestRestrictionDialog({
  onOpenChange,
}: RequestRestrictionDialogProps) {
  const navigateAfterChange = useNavigateAfterSignupChange();
  const [reason, setReason] = useState<SuspensionReason>(DEFAULT_REASON);

  const suspendUser = useMutation({
    ...suspendUserMutationOptions(),
    onSuccess: () => navigateAfterChange("/suspended"),
  });

  return (
    <Modal
      actionLabel="Request restriction"
      description="If you confirm this request, your access to the prototype will be suspended while your request is being reviewed."
      errorMessage={suspendUser.isError ? GENERIC_ERROR_MESSAGE : undefined}
      isActionDisabled={suspendUser.isPending}
      isCancelDisabled={suspendUser.isPending}
      isOpen
      onConfirm={() =>
        suspendUser.mutate({ body: { suspensionReason: reason } })
      }
      onOpenChange={onOpenChange}
      title="Request restriction of processing"
    >
      <RadioGroup
        label="Please select the reason for your request, under Article 18 of the GDPR."
        onChange={(value) => setReason(value as SuspensionReason)}
        value={reason}
      >
        {RESTRICTION_REASONS.map((option) => (
          <Radio key={option.value} value={option.value}>
            {option.label}
          </Radio>
        ))}
      </RadioGroup>
    </Modal>
  );
}
