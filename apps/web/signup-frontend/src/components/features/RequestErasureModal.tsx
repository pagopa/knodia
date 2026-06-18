import { Modal } from "@/components/ui";

interface RequestErasureModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function RequestErasureModal({
  isOpen,
  onOpenChange,
}: RequestErasureModalProps) {
  // TODO(KN-786): enable once the user-deletion route is wired
  return (
    <Modal
      actionLabel="Request erasure"
      description="If you confirm this request, your access to the prototype will be removed and your data will be permanently erased. This process may take a few days."
      isActionDisabled
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="Request data erasure"
    />
  );
}
