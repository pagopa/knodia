import { Button } from "@knodia/ui-kit/ui";

interface FooterProps {
  cancelLabel?: string;
  confirmLabel?: string;
  isDisabled?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function Footer({
  cancelLabel = "Previous",
  confirmLabel = "Next",
  isDisabled = false,
  onCancel,
  onConfirm,
}: FooterProps) {
  return (
    <div className="flex justify-end gap-4">
      <Button hierarchy="neutral" kind="tonal" onPress={onCancel} size="lg">
        {cancelLabel}
      </Button>
      <Button isDisabled={isDisabled} onPress={onConfirm} size="lg">
        {confirmLabel}
      </Button>
    </div>
  );
}
