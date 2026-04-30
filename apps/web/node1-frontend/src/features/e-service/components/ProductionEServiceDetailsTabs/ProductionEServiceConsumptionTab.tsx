import { type EserviceId, unsafeBrandId } from "@knodia/common-models/ids";
import {
  Banner,
  Empty,
  InteractiveIcon,
  Loader,
  Tooltip,
} from "@knodia/ui-kit/ui";
import { QuestionIcon, SelectionIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { TooltipTrigger } from "react-aria-components";

import { GenericInfoCard } from "@/components/GenericInfoCard";
import { ButtonLinkWithPreload } from "@/components/routerLinks";
import { Section } from "@/components/Section";
import { producerRecentAgreementsByEserviceQuery } from "@/features/agreement/services/queries";
import { producerRecentPurposesByEserviceQuery } from "@/features/purpose/services/queries";
import { formatNumber } from "@/utils/formatters";

import { useProductionEserviceDetailsContext } from "../../contexts/useProductionEserviceDetailsContext";
import { ConsumptionAgreementTable } from "./ConsumptionAgreementTable";
import { ConsumptionPurposeTable } from "./ConsumptionPurposeTable";

export function ProductionEServiceConsumptionTab() {
  return (
    <Section className="flex flex-col gap-2" title="Consumption">
      <div className="flex flex-col gap-10">
        <ProductionEserviceAgreements />
        <ProductionEservicePurposes />
      </div>
    </Section>
  );
}

function ProductionEserviceAgreements() {
  const { agreements } = useProductionEserviceDetailsContext();

  return (
    <div className="flex flex-col gap-8">
      <h3 className="title-md-em text-primary-light-high-contrast">
        Agreements
      </h3>
      {agreements.active === 0 && agreements.suspended === 0 ? (
        <Banner icon={<SelectionIcon />} kind="neutral">
          There are no Agreements for this E-Service yet.
        </Banner>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4">
            <GenericInfoCard label="Active">
              {formatNumber(agreements.active)}
            </GenericInfoCard>
            <GenericInfoCard label="Suspended">
              {formatNumber(agreements.suspended)}
            </GenericInfoCard>
          </div>
          <RecentAgreementsSection />
        </>
      )}
    </div>
  );
}

function ProductionEservicePurposes() {
  const { purposes } = useProductionEserviceDetailsContext();

  return (
    <div className="flex flex-col gap-8">
      <h3 className="title-md-em text-primary-light-high-contrast">Purposes</h3>
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
              {formatNumber(purposes.totalApiCallsPerDay)}
            </GenericInfoCard>
          </div>
          <RecentPurposesSection />
        </>
      )}
    </div>
  );
}

function RecentAgreementsSection() {
  const { id } = useProductionEserviceDetailsContext();
  const eserviceId = unsafeBrandId<EserviceId>(id);
  const { data, isLoading } = useQuery(
    producerRecentAgreementsByEserviceQuery(eserviceId),
  );

  if (isLoading) {
    return <Loader className="mx-auto" label="Loading..." />;
  }

  const agreements = data?.results ?? [];

  if (agreements.length === 0) {
    return (
      <Empty
        action={{
          as: "link",
          hierarchy: "brand",
          href: { search: { eserviceId }, to: "/production/agreements" },
          kind: "tonal",
          label: "View all",
        }}
        description="You can view old Agreements in the Agreements page."
        icon={null}
        kind="neutral"
        title="There are no new Agreements"
      />
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <ConsumptionAgreementTable agreements={agreements} />
      <ButtonLinkWithPreload
        hierarchy="brand"
        kind="tonal"
        search={{ eserviceId }}
        size="md"
        to="/production/agreements"
      >
        View all
      </ButtonLinkWithPreload>
    </div>
  );
}

function RecentPurposesSection() {
  const { id } = useProductionEserviceDetailsContext();
  const eserviceId = unsafeBrandId<EserviceId>(id);
  const { data, isLoading } = useQuery(
    producerRecentPurposesByEserviceQuery(eserviceId),
  );

  if (isLoading) {
    return <Loader className="mx-auto" label="Loading..." />;
  }

  const purposes = data?.results ?? [];

  if (purposes.length === 0) {
    return (
      <Empty
        action={{
          as: "link",
          hierarchy: "brand",
          href: { search: { eserviceId }, to: "/production/purposes" },
          kind: "tonal",
          label: "View all",
        }}
        description="You can view old Purposes in the Purposes page."
        icon={null}
        kind="neutral"
        title="There are no new Purposes"
      />
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <ConsumptionPurposeTable purposes={purposes} />
      <ButtonLinkWithPreload
        hierarchy="brand"
        kind="tonal"
        search={{ eserviceId }}
        size="md"
        to="/production/purposes"
      >
        View all
      </ButtonLinkWithPreload>
    </div>
  );
}
