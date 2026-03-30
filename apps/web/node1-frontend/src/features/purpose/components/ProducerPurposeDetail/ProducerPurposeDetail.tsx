import type { bffApi } from "@knodia/bff-client";

import { Button, Link } from "@knodia/ui-kit/ui";
import { createLink } from "@tanstack/react-router";
import { match } from "ts-pattern";

import { OrganizationContactPopover } from "@/components/OrganizationContactPopover";
import { PageHeader } from "@/components/PageHeader";
import { SettingsCard } from "@/components/SettingCard";
import { AgreementCard } from "@/features/agreement/components/AgreementCard";
import { EserviceStateChip } from "@/features/e-service/components/EserviceStateChip";
import { PurposeStateChip } from "@/features/purpose/components/PurposeStateChip";

const RouterLink = createLink(Link);

export function ProducerPurposeDetail({
  purpose,
}: {
  purpose: bffApi.ProducerPurposeDetails;
}) {
  return (
    <>
      <PageHeader
        actions={<PurposeActionButton state={purpose.state} />}
        description={purpose.description.en}
        resourceStatusChip={<PurposeStateChip state={purpose.state} />}
        title={purpose.name.en}
      />

      <div className="mt-10 flex flex-col gap-4">
        <SettingsCard label="E-Service">
          <span className="flex items-center gap-6">
            <RouterLink
              params={{ id: purpose.eservice.id }}
              to="/production/e-services/$id"
              variant="inline"
            >
              {purpose.eservice.name.en}
            </RouterLink>
            <EserviceStateChip state={purpose.eservice.latestVersionState} />
          </span>
        </SettingsCard>

        <div className="grid grid-cols-2 gap-4">
          <SettingsCard label="Producer">
            {purpose.producer.name} - {purpose.producer.knodeId} Knode
          </SettingsCard>
          <SettingsCard label="Consumer">
            <span className="flex items-center gap-2">
              {purpose.consumer.name} - {purpose.consumer.knodeId} Knode
              {/* TODO: Replace mocked contact info with real data from the API when available in ProducerPurposeDetails */}
              <OrganizationContactPopover
                email="contact@example.com"
                knodeId={purpose.consumer.knodeId}
                name={purpose.consumer.name}
                notes="—"
              />
            </span>
          </SettingsCard>
        </div>

        <SettingsCard label="Declared API calls per day">
          {purpose.dailyCalls.toLocaleString()}{" "}
          <span className="title-md font-normal">
            (max {purpose.maxDailyCallsPerConsumer.toLocaleString()})
          </span>
        </SettingsCard>
      </div>

      <AgreementCard agreement={purpose.agreement} className="mt-10" />
    </>
  );
}

function PurposeActionButton({ state }: { state: bffApi.PurposeState }) {
  return match(state)
    .with("Active", () => (
      <Button hierarchy="danger" isDisabled kind="tonal" size="md">
        Suspend
      </Button>
    ))
    .with("Suspended", () => (
      <Button hierarchy="brand" isDisabled kind="filled" size="md">
        Reactivate
      </Button>
    ))
    .with("Archived", () => {
      console.warn("Unhandled purpose state: Archived");
      return null;
    })
    .exhaustive();
}
