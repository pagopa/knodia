import type { bffApi } from "@knodia/bff-client";
import type { EserviceId } from "@knodia/common-models/ids";

import { Empty, Loader } from "@knodia/ui-kit/ui";
import { SelectionIcon } from "@phosphor-icons/react";

import { ProducerEserviceFilter } from "@/features/e-service/components/ProducerEserviceFilter";

import { ProducerPurposeTable } from "./ProducerPurposeTable/ProducerPurposeTable";

export function ProducerPurposeSection({
  eserviceId,
  isLoading,
  onEserviceIdChange,
  purposes,
}: {
  eserviceId: EserviceId | undefined;
  isLoading: boolean;
  onEserviceIdChange: (eserviceId: EserviceId | undefined) => void;
  purposes: bffApi.ProducerPurpose[];
}) {
  const hasFilters = eserviceId !== undefined;
  const showContent = isLoading || hasFilters || purposes.length > 0;

  if (!showContent) {
    return (
      <Empty
        description="Purposes created for your E-Services by Consumer Organizations will appear here."
        icon={<SelectionIcon />}
        title="There are no Purposes for your E-Services yet."
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

  if (purposes.length === 0) {
    return (
      <>
        {filters}
        <Empty
          icon={<SelectionIcon />}
          title="No Purposes match the selected filter."
        />
      </>
    );
  }

  return (
    <>
      {filters}
      <ProducerPurposeTable purposes={purposes} />
    </>
  );
}
