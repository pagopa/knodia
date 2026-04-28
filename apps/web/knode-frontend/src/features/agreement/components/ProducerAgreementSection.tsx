import type { bffApi } from "@knodia/bff-client";
import type { EserviceId } from "@knodia/common-models/ids";

import { Empty, Loader } from "@knodia/ui-kit/ui";
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
  const hasFilters = eserviceId !== undefined;
  const showContent = isLoading || hasFilters || agreements.length > 0;

  if (!showContent) {
    return (
      <Empty
        description="Agreements requested for your E-Services by Consumer Organizations will appear here."
        icon={<SelectionIcon />}
        kind="brand-soft"
        title="There are no Agreements for your E-Services."
      />
    );
  }

  const filters = (
    <ProducerEserviceFilter
      eserviceId={eserviceId}
      onEserviceIdChange={onEserviceIdChange}
    />
  );

  if (isLoading) {
    return (
      <>
        {filters}
        <Loader className="mx-auto mt-20" label="Loading..." />
      </>
    );
  }

  if (agreements.length === 0) {
    return (
      <>
        {filters}
        <Empty
          icon={<SelectionIcon />}
          kind="brand-soft"
          title="No Agreements match the selected filter."
        />
      </>
    );
  }

  return (
    <>
      {filters}
      <ProducerAgreementTable agreements={agreements} />
    </>
  );
}
