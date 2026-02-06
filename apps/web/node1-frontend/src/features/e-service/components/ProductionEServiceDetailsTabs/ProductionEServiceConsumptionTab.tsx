import { Empty } from "@knodia/ui-kit/ui";
import { SelectionIcon } from "@phosphor-icons/react";

import { Section } from "./Section";

export function ProductionEServiceConsumptionTab() {
  return (
    <Section className="flex flex-col gap-6" title="Consumption">
      <div>
        <h3 className="title-md-em text-primary-light-high-contrast mb-6">
          Agreements
        </h3>
        {/**
         * TODO: Insert real values
         * */}
        <Empty
          description="There are no Agreements for this E-Service yet."
          icon={<SelectionIcon />}
          kind="neutral"
        />
      </div>
      <div>
        <h3 className="title-md-em text-primary-light-high-contrast mb-6">
          Purposes
        </h3>
        {/**
         * TODO: Insert real values
         * */}
        <Empty
          description="There are no Purposes for this E-Service yet."
          icon={<SelectionIcon />}
          kind="neutral"
        />
      </div>
    </Section>
  );
}
