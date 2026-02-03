import { Button } from "@knodia/ui-kit/ui";

interface FooterProps {
  cancelLabel?: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export function Footer({
  cancelLabel = "Previous",
  confirmLabel = "Next",
  onCancel,
  onConfirm,
}: FooterProps) {
  return (
    <div className="flex justify-end gap-4">
      <Button hierarchy="neutral" kind="tonal" onPress={onCancel} size="lg">
        {cancelLabel}
      </Button>
      <Button onPress={onConfirm} size="lg">
        {confirmLabel}
      </Button>
    </div>
  );
}
