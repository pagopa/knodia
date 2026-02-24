import { bffApi } from "@knodia/bff-client";
import { Empty, Loader } from "@knodia/ui-kit/ui";
import { SelectionPlusIcon } from "@phosphor-icons/react";

import { ProductionEserviceCard } from "./ProductionEserviceCard";

export function ProductionEserviceList({
  eservices,
  isLoading,
}: {
  eservices: bffApi.ProducerEservice[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return <Loader className="mx-auto mt-20" label="Loading..." />;
  }

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
