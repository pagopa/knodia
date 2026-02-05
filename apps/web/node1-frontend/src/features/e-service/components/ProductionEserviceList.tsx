import type { Eservice } from "@knodia/bff-client";

import { ProductionEserviceCard } from "./EserviceCard";

export function ProductionEserviceList({
  eservices,
}: {
  eservices: Eservice[];
}) {
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
