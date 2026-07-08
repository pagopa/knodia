import { getCategory } from "@knodia/category-models";
import { Chip } from "@knodia/ui-kit/ui";

export function CategoryChip({
  code,
  scheme,
}: {
  code: string;
  scheme: string;
}) {
  const label = getCategory({ code, scheme })?.name ?? code;
  return <Chip kind="neutral" label={label} type="light" />;
}
