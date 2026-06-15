import { useState } from "react";

import { Modal, Radio, RadioGroup } from "@/components/ui";

const RESTRICTION_REASONS = [
  {
    label:
      "I believe my data is inaccurate and I want to challenge it – Art. 18.1.(a)",
    value: "18.1.a",
  },
  {
    label:
      "My data was processed unlawfully, but I prefer restriction to erasure – Art. 18.1.(b)",
    value: "18.1.b",
  },
  {
    label:
      "You no longer need my data, but I need it for a legal claim – Art. 18.1.(c)",
    value: "18.1.c",
  },
  {
    label:
      "I have objected to processing under Art. 21 and I am waiting verification – Art. 18.1.(d)",
    value: "18.1.d",
  },
];

const DEFAULT_REASON = "18.1.a";

interface RequestRestrictionModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function RequestRestrictionModal({
  isOpen,
  onOpenChange,
}: RequestRestrictionModalProps) {
  const [reason, setReason] = useState<string>(DEFAULT_REASON);

  // TODO: enable once the restriction route is wired
  return (
    <Modal
      actionLabel="Request restriction"
      description="If you confirm this request, your access to the prototype will be suspended while your request is being reviewed."
      isActionDisabled
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="Request restriction of processing"
    >
      <RadioGroup
        label="Please select the reason for your request, under Article 18 of the GDPR."
        onChange={setReason}
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
