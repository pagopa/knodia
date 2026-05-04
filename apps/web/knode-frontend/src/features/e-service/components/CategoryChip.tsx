import { getCategory } from "@knodia/category-models";
import { Chip } from "@knodia/ui-kit/ui";
import { CheckIcon } from "@phosphor-icons/react";

export function CategoryChip({
  code,
  scheme,
  showIcon = true,
}: {
  code: string;
  scheme: string;
  showIcon?: boolean;
}) {
  const label = getCategory(scheme, code)?.name ?? code;
  return (
    <Chip
      icon={showIcon ? <CheckIcon /> : undefined}
      kind="neutral"
      label={label}
      type="light"
    />
  );
}
