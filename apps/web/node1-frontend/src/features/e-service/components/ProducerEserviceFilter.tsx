import { type EserviceId, unsafeBrandId } from "@knodia/common-models/ids";
import { ComboBox, ComboBoxItem } from "@knodia/ui-kit/ui";
import { useQuery } from "@tanstack/react-query";

import { producerEserviceOptionsQuery } from "@/features/e-service/services/queries";

export function ProducerEserviceFilter({
  eserviceId,
  onEserviceIdChange,
}: {
  eserviceId: EserviceId | undefined;
  onEserviceIdChange: (eserviceId: EserviceId | undefined) => void;
}) {
  const { data } = useQuery(producerEserviceOptionsQuery());
  const options = data?.results ?? [];

  return (
    <div className="mb-8 max-w-xs">
      <ComboBox
        defaultItems={options}
        isClearable
        label="E-Service"
        onSelectionChange={(key) => {
          onEserviceIdChange(
            key === null ? undefined : unsafeBrandId<EserviceId>(String(key)),
          );
        }}
        placeholder="All E-Services"
        selectedKey={eserviceId ?? null}
      >
        {(es) => <ComboBoxItem id={es.id}>{es.name.en}</ComboBoxItem>}
      </ComboBox>
    </div>
  );
}
