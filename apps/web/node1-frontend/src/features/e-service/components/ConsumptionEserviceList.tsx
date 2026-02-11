import { Empty } from "@knodia/ui-kit/ui";
import { SelectionPlusIcon } from "@phosphor-icons/react";

export function ConsumptionEserviceList() {
  return (
    <Empty
      description="Search for an E-Service to request an Agreement."
      icon={<SelectionPlusIcon />}
      title="You don't consume any E-Service yet."
    />
  );
}
