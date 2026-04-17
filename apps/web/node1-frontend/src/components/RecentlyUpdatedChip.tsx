import { Chip } from "@knodia/ui-kit/ui";
import { WarningCircleIcon } from "@phosphor-icons/react";

export function RecentlyUpdatedChip() {
  return (
    <Chip
      icon={<WarningCircleIcon weight="bold" />}
      kind="informative"
      label="Recent update"
      type="bright"
    />
  );
}
