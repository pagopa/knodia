import { type bffApi } from "@knodia/bff-client";
import { Empty, Loader } from "@knodia/ui-kit/ui";
import { SelectionPlusIcon } from "@phosphor-icons/react";

import { useHasRole } from "@/contexts/auth";

import { ProductionEserviceCard } from "./ProductionEserviceCard";

export function ProductionEserviceList({
  eservices,
  isLoading,
}: {
  eservices: bffApi.ProducerEservice[];
  isLoading: boolean;
}) {
  const canPublishEservices = useHasRole("technical");

  if (isLoading) {
    return <Loader className="mx-auto mt-20" label="Loading..." />;
  }

  if (eservices.length === 0) {
    return (
      <Empty
        description={
          canPublishEservices
            ? "Create your first one."
            : "New E-Services will appear here."
        }
        icon={<SelectionPlusIcon />}
        kind="brand-soft"
        title="You don't have any E-Services yet."
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
