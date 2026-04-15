import type { bffApi } from "@knodia/bff-client";

import { type AgreementId, unsafeBrandId } from "@knodia/common-models/ids";
import { Button } from "@knodia/ui-kit/ui";
import { match } from "ts-pattern";

import { OrganizationCard } from "@/components/OrganizationCard";
import { PageHeader } from "@/components/PageHeader";
import { RouterLink } from "@/components/routerLinks";
import { SettingsCard } from "@/components/SettingCard";
import { useHasRole } from "@/contexts/auth";
import { EserviceStateChip } from "@/features/e-service/components/EserviceStateChip";

import { AgreementStateChip } from "../AgreementStateChip";
import { AgreementPurposeSection } from "./AgreementPurposeSection";

export function ProducerAgreementDetail({
  agreement,
}: {
  agreement: bffApi.ProducerAgreementDetails;
}) {
  const canManageAgreementState = useHasRole("administrative");

  return (
    <>
      <PageHeader
        actions={
          canManageAgreementState && (
            <AgreementActionButton state={agreement.state} />
          )
        }
        resourceStatusChip={
          <AgreementStateChip state={agreement.state} type="light" />
        }
        title="Agreement request"
      />

      <div className="flex flex-col gap-4">
        <SettingsCard label="E-Service">
          <span className="flex items-center gap-6">
            <RouterLink
              params={{ id: agreement.eservice.id }}
              to="/production/e-services/$id"
              variant="inline"
            >
              {agreement.eservice.name.en}
            </RouterLink>
            <EserviceStateChip state={agreement.latestEserviceVersionState} />
          </span>
        </SettingsCard>

        <div className="grid grid-cols-2 gap-4">
          <OrganizationCard
            label="Producer"
            organization={agreement.producer}
            showContact={false}
          />
          <OrganizationCard
            label="Consumer"
            organization={agreement.consumer}
            showContact={true}
          />
        </div>
      </div>

      <AgreementPurposeSection
        agreementId={unsafeBrandId<AgreementId>(agreement.id)}
      />
    </>
  );
}

function AgreementActionButton({
  state,
}: {
  state: bffApi.ProducerAgreementDetails["state"];
}) {
  return (
    match(state)
      .with("Active", () => (
        // TODO: Suspend button is always disabled — implement suspend logic
        <Button hierarchy="danger" isDisabled kind="tonal" size="md">
          Suspend
        </Button>
      ))
      .with("Suspended", () => (
        // TODO: Reactivate button is always disabled — implement reactivate logic.
        // If the agreement was suspended by the consumer, no button should be shown.
        <Button hierarchy="brand" isDisabled kind="filled" size="md">
          Reactivate
        </Button>
      ))
      // TODO: Only Active and Suspended states are supported. Archived is not handled yet.
      .with("Archived", () => {
        console.warn("Unhandled agreement state: Archived");
        return null;
      })
      .exhaustive()
  );
}
