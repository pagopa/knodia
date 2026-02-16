import { Banner, InteractiveIcon, Tooltip } from "@knodia/ui-kit/ui";
import { QuestionIcon, SelectionIcon } from "@phosphor-icons/react";
import { useNumberFormatter } from "react-aria";
import { TooltipTrigger } from "react-aria-components";
import { match } from "ts-pattern";

import { GenericInfoCard } from "@/components/GenericInfoCard";

import { useProductionEserviceDetailsContext } from "../../contexts/useProductionEserviceDetailsContext";
import { Section } from "./Section";

export function ProductionEServiceConsumptionTab() {
  return (
    <Section className="flex flex-col gap-6" title="Consumption">
      <ProductionEserviceAgreements />
      <ProductionEservicePurposes />
    </Section>
  );
}

function ProductionEserviceAgreements() {
  const { agreements } = useProductionEserviceDetailsContext();
  const numberFormatter = useNumberFormatter();

  return (
    <div>
      <h3 className="title-md-em text-primary-light-high-contrast mb-6">
        Agreements
      </h3>
      {match(agreements.total)
        .with(0, () => (
          <Banner icon={<SelectionIcon />} kind="neutral">
            There are no Agreements for this E-Service yet.
          </Banner>
        ))
        .otherwise(() => (
          <div className="grid grid-cols-2 gap-4">
            <GenericInfoCard label="Total">
              {numberFormatter.format(agreements.total)}
            </GenericInfoCard>
            <GenericInfoCard label="Active">
              {numberFormatter.format(agreements.active)}
            </GenericInfoCard>
          </div>
        ))}
    </div>
  );
}

function ProductionEservicePurposes() {
  const { purposes } = useProductionEserviceDetailsContext();
  const numberFormatter = useNumberFormatter();

  return (
    <div>
      <h3 className="title-md-em text-primary-light-high-contrast mb-6">
        Purposes
      </h3>
      {match(purposes.total)
        .with(0, () => (
          <Banner icon={<SelectionIcon />} kind="neutral">
            There are no Purposes for this E-Service yet.
          </Banner>
        ))
        .otherwise(() => (
          <div className="grid grid-cols-3 gap-4">
            <GenericInfoCard label="Total">
              {numberFormatter.format(purposes.total)}
            </GenericInfoCard>
            <GenericInfoCard label="Active">
              {numberFormatter.format(purposes.active)}
            </GenericInfoCard>
            <GenericInfoCard
              label={
                <>
                  Total API calls per day
                  <TooltipTrigger>
                    <InteractiveIcon>
                      <QuestionIcon />
                    </InteractiveIcon>
                    <Tooltip>
                      Sum of all API calls per day declared by Active Purposes
                    </Tooltip>
                  </TooltipTrigger>
                </>
              }
            >
              {numberFormatter.format(purposes.totalApiCallsPerDay)}
            </GenericInfoCard>
          </div>
        ))}
    </div>
  );
}
