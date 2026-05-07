import type { bffApi } from "@knodia/bff-client";
import type { EserviceId } from "@knodia/common-models/ids";

import { Empty } from "@knodia/ui-kit/ui";
import { SelectionIcon } from "@phosphor-icons/react";

import { ProducerEserviceFilter } from "@/features/e-service/components/ProducerEserviceFilter";

import { ProducerAgreementTable } from "./ProducerAgreementTable/ProducerAgreementTable";

export function ProducerAgreementSection({
  agreements,
  eserviceId,
  isLoading,
  onEserviceIdChange,
}: {
  agreements: bffApi.ProducerAgreement[];
  eserviceId: EserviceId | undefined;
  isLoading: boolean;
  onEserviceIdChange: (eserviceId: EserviceId | undefined) => void;
}) {
  if (!isLoading && eserviceId === undefined && agreements.length === 0) {
    return (
      <Empty
        description="Agreements requested for your E-Services by Consumer Organizations will appear here."
        icon={<SelectionIcon />}
        kind="brand-soft"
        title="There are no Agreements for your E-Services."
      />
    );
  }

  return (
    <>
      <ProducerEserviceFilter
        eserviceId={eserviceId}
        onEserviceIdChange={onEserviceIdChange}
      />
      <ProducerAgreementTable agreements={agreements} isLoading={isLoading} />
    </>
  );
}
