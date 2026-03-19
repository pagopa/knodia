import { ComboBox, ComboBoxItem } from "@knodia/ui-kit/ui";

import type { ConsumptionEserviceListParams } from "@/features/e-service/models/search-params";

type AgreementStateFilter = ConsumptionEserviceListParams["agreementState"];

const agreementStateOptions: {
  id: NonNullable<AgreementStateFilter>;
  label: string;
}[] = [
  { id: "Active", label: "Active" },
  { id: "Suspended", label: "Suspended" },
];

export function ConsumptionEserviceFilters({
  agreementState,
  onAgreementStateChange,
}: {
  agreementState: AgreementStateFilter;
  onAgreementStateChange: (state: AgreementStateFilter) => void;
}) {
  return (
    <div className="mb-6 max-w-xs">
      <ComboBox
        inputValue={
          agreementStateOptions.find((o) => o.id === agreementState)?.label ??
          ""
        }
        isClearable
        label="Agreement status"
        onSelectionChange={(key) =>
          onAgreementStateChange(
            key === null
              ? undefined
              : (key as NonNullable<AgreementStateFilter>),
          )
        }
        placeholder="All statuses"
        selectedKey={agreementState ?? null}
      >
        {agreementStateOptions.map((option) => (
          <ComboBoxItem id={option.id} key={option.id}>
            {option.label}
          </ComboBoxItem>
        ))}
      </ComboBox>
    </div>
  );
}
