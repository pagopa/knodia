import { API_AgreementState } from "@knodia/agreement-models/api";
import { ComboBox, ComboBoxItem } from "@knodia/ui-kit/ui";

import type { ConsumptionEserviceListParams } from "@/features/e-service/models/search-params";

type AgreementStateFilter = ConsumptionEserviceListParams["agreementState"];

const agreementStateOptions: {
  id: NonNullable<AgreementStateFilter>;
  label: string;
}[] = [
  { id: API_AgreementState.enum.Active, label: "Active" },
  { id: API_AgreementState.enum.Suspended, label: "Suspended" },
  {
    id: API_AgreementState.enum.PendingConsumerOperatorIdentification,
    label: "Action needed",
  },
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
        inputValue={getAgreementStateLabel(agreementState)}
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

function getAgreementStateLabel(state: AgreementStateFilter): string {
  return agreementStateOptions.find((o) => o.id === state)?.label ?? "";
}
