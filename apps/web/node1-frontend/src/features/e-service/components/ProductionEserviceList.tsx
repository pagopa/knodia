import type { Eservice } from "@knodia/bff-client";

import { Empty } from "@knodia/ui-kit/ui";
import { SelectionPlusIcon } from "@phosphor-icons/react";

import { ProductionEserviceCard } from "./EserviceCard";

export function ProductionEserviceList({
  eservices,
}: {
  eservices: Eservice[];
}) {
  if (eservices.length === 0) {
    return (
      <Empty
        description="Create your first one"
        icon={<SelectionPlusIcon />}
        title="You don't have any E-Services yet"
      />
    );
  }

  return (
    <ul className="flex flex-col gap-4" role="list">
      {eservices.map((eservice) => (
        <li key={eservice.id}>
          <ProductionEserviceCard eservice={eservice} />
        </li>
      ))}
    </ul>
  );
}
