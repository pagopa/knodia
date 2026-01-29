import { Button } from "@knodia/ui-kit/ui";

interface Props {
  cancelLabel?: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export const Footer = ({
  cancelLabel = "Previous",
  confirmLabel = "Next",
  onCancel,
  onConfirm,
}: Props) => (
  <div className="flex justify-end pt-4 gap-4">
    <Button hierarchy="neutral" kind="tonal" onPress={onCancel}>
      {cancelLabel}
    </Button>
    <Button onPress={onConfirm}>{confirmLabel}</Button>
  </div>
);
