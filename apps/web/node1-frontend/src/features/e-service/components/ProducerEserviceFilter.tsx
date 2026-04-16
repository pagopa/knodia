import { type EserviceId, unsafeBrandId } from "@knodia/common-models/ids";
import { ComboBox, ComboBoxItem } from "@knodia/ui-kit/ui";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

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

  const [inputValue, setInputValue] = useState(
    getEserviceLabel(options, eserviceId),
  );

  const filteredOptions = options.filter((es) =>
    es.name.en.toLowerCase().includes(inputValue.toLowerCase()),
  );

  return (
    <div className="mb-8 max-w-xs">
      <ComboBox
        inputValue={inputValue}
        isClearable
        items={filteredOptions}
        label="E-Service"
        onInputChange={setInputValue}
        onSelectionChange={(key) => {
          if (key === null) {
            setInputValue("");
            onEserviceIdChange(undefined);
          } else {
            setInputValue(getEserviceLabel(options, String(key)));
            onEserviceIdChange(unsafeBrandId<EserviceId>(String(key)));
          }
        }}
        placeholder="All E-Service"
        selectedKey={eserviceId ?? null}
      >
        {(es) => <ComboBoxItem id={es.id}>{es.name.en}</ComboBoxItem>}
      </ComboBox>
    </div>
  );
}

function getEserviceLabel(
  options: { id: string; name: { en: string } }[],
  eserviceId: string | undefined,
): string {
  return options.find((o) => o.id === eserviceId)?.name.en ?? "";
}
