import type { bffApi } from "@knodia/bff-client";

import { Button, Link } from "@knodia/ui-kit/ui";
import { createLink } from "@tanstack/react-router";
import { match } from "ts-pattern";

import { OrganizationContactPopover } from "@/components/OrganizationContactPopover";
import { PageHeader } from "@/components/PageHeader";
import { SettingsCard } from "@/components/SettingCard";
import { EserviceStateChip } from "@/features/e-service/components/EserviceStateChip";

import { AgreementStateChip } from "../AgreementStateChip";

const RouterLink = createLink(Link);

export function ProducerAgreementDetail({
  agreement,
}: {
  agreement: bffApi.ProducerAgreementDetails;
}) {
  return (
    <>
      <PageHeader
        actions={<AgreementActionButton state={agreement.state} />}
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
            <EserviceStateChip state={agreement.eserviceState} />
          </span>
        </SettingsCard>

        <div className="grid grid-cols-2 gap-4">
          <SettingsCard label="Producer">
            {agreement.producer.name} - {agreement.producer.knodeId} Knode
          </SettingsCard>
          <SettingsCard label="Consumer">
            <span className="flex items-center gap-2">
              {agreement.consumer.name} - {agreement.consumer.knodeId} Knode
              {/* TODO: Replace mocked contact info with real data from the API when available in ProducerAgreementDetails */}
              <OrganizationContactPopover
                email="contact@example.com"
                knodeName={agreement.consumer.knodeId}
                name={agreement.consumer.name}
                notes="—"
              />
            </span>
          </SettingsCard>
        </div>
      </div>

      {/* TODO: Implement Purposes section */}
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
