import { Banner, Empty, InteractiveIcon, Tooltip } from "@knodia/ui-kit/ui";
import { QuestionIcon, SelectionIcon } from "@phosphor-icons/react";
import { TooltipTrigger } from "react-aria-components";

import { GenericInfoCard } from "@/components/GenericInfoCard";
import { formatNumber } from "@/utils/formatters";

import { useProductionEserviceDetailsContext } from "../../contexts/useProductionEserviceDetailsContext";
import { Section } from "../Section";

export function ProductionEServiceConsumptionTab() {
  return (
    <Section className="flex flex-col gap-6" title="Consumption">
      <ProductionEserviceAgreements />
      <ProductionEservicePurposes />
    </Section>
  );
}
function NewAgreementsTable() {
  return (
    <Empty
      action={{
        as: "link",
        hierarchy: "brand",
        href: { to: "/production/agreements" },
        kind: "tonal",
        label: "View all",
      }}
      className="mt-12"
      description="You can view old Agreements in the Agreements page."
      icon={null}
      kind="neutral"
      title="There are no new Agreements"
    />
  );
}

function NewPurposesTable() {
  return (
    <Empty
      action={{
        as: "link",
        hierarchy: "brand",
        href: { to: "/production/purposes" },
        kind: "tonal",
        label: "View all",
      }}
      className="mt-12"
      description="You can view old Purposes in the Purposes page."
      icon={null}
      kind="brand"
      title="There are no new Purposes"
    />
  );
}

function ProductionEserviceAgreements() {
  const { agreements } = useProductionEserviceDetailsContext();

  return (
    <div>
      <h3 className="title-md-em text-primary-light-high-contrast mb-6">
        Agreements
      </h3>
      {agreements.total === 0 ? (
        <Banner icon={<SelectionIcon />} kind="neutral">
          There are no Agreements for this E-Service yet.
        </Banner>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4">
            <GenericInfoCard label="Total">
              {formatNumber(agreements.total)}
            </GenericInfoCard>
            <GenericInfoCard label="Active">
              {formatNumber(agreements.active)}
            </GenericInfoCard>
          </div>
          <NewAgreementsTable />
        </>
      )}
    </div>
  );
}

function ProductionEservicePurposes() {
  const { purposes } = useProductionEserviceDetailsContext();

  return (
    <div>
      <h3 className="title-md-em text-primary-light-high-contrast mb-6">
        Purposes
      </h3>
      {purposes.total === 0 ? (
        <Banner icon={<SelectionIcon />} kind="neutral">
          There are no Purposes for this E-Service yet.
        </Banner>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4">
            <GenericInfoCard label="Total">
              {formatNumber(purposes.total)}
            </GenericInfoCard>
            <GenericInfoCard label="Active">
              {formatNumber(purposes.active)}
            </GenericInfoCard>
            <GenericInfoCard
              label={
                <div className="flex items-center gap-2">
                  Total API calls per day
                  <TooltipTrigger>
                    <InteractiveIcon>
                      <QuestionIcon />
                    </InteractiveIcon>
                    <Tooltip>
                      Sum of all API calls per day declared by Active Purposes
                    </Tooltip>
                  </TooltipTrigger>
                </div>
              }
            >
              {purposes.totalApiCallsPerDay}
            </GenericInfoCard>
          </div>
          <NewPurposesTable />
        </>
      )}
    </div>
  );
}
