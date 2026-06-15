import { Modal } from "@/components/ui";

interface RequestErasureModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function RequestErasureModal({
  isOpen,
  onOpenChange,
}: RequestErasureModalProps) {
  return (
    <Modal
      actionLabel="Request erasure"
      description="If you confirm this request, your access to the prototype will be removed and your data will be permanently erased. This process may take a few days."
      isOpen={isOpen}
      onConfirm={() => onOpenChange(false)}
      onOpenChange={onOpenChange}
      title="Request data erasure"
    />
  );
}
