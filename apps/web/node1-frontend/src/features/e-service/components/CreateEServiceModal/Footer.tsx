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
      <Button hierarchy="neutral" kind="tonal" onPress={onCancel}>
        {cancelLabel}
      </Button>
      <Button onPress={onConfirm}>{confirmLabel}</Button>
    </div>
  );
}
