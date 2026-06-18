import type { EserviceId, KnodeId } from "@knodia/common-models/ids";

import { SelectionIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";

import { ConsumerKeychainsTable } from "@/features/keychain/components/ConsumerKeychainsTable";

import { eserviceLinkedConsumerKeychainsQuery } from "../services/queries";

export function EserviceConsumerKeychainsSection({
  eserviceId,
  knodeId,
}: {
  eserviceId: EserviceId;
  knodeId: KnodeId;
}) {
  const { data, isLoading } = useQuery(
    eserviceLinkedConsumerKeychainsQuery(eserviceId, knodeId),
  );

  return (
    <div className="mt-4 flex flex-col gap-6">
      <h3 className="title-md-em text-primary-light-low-contrast">Keychains</h3>
      <ConsumerKeychainsTable
        emptyState={{
          icon: <SelectionIcon />,
          message:
            "To request an access token for this E-Service, associate a Keychain to a Purpose from the Purpose page. Associated Keychains will appear here.",
        }}
        isLoading={isLoading}
        keychains={data?.results ?? []}
      />
    </div>
  );
}
