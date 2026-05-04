import type { EserviceId } from "@knodia/common-models/ids";

import { useQuery } from "@tanstack/react-query";

import { eserviceLinkedConsumerKeychainsQuery } from "../services/queries";
import { EserviceLinkedConsumerKeychainsTable } from "./EserviceLinkedConsumerKeychainsTable";

export function EserviceConsumerKeychainsSection({
  eserviceId,
}: {
  eserviceId: EserviceId;
}) {
  const { data, isLoading } = useQuery(
    eserviceLinkedConsumerKeychainsQuery(eserviceId),
  );

  return (
    <div className="mt-4 flex flex-col gap-6">
      <h3 className="title-md-em text-primary-light-low-contrast">Keychains</h3>
      <EserviceLinkedConsumerKeychainsTable
        isLoading={isLoading}
        keychains={data?.results ?? []}
      />
    </div>
  );
}
