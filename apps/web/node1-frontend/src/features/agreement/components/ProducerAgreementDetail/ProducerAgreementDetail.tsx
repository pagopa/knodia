import type { bffApi } from "@knodia/bff-client";

import { Button, Link } from "@knodia/ui-kit/ui";
import { createLink } from "@tanstack/react-router";

import { PageHeader } from "@/components/PageHeader";
import { SettingsCard } from "@/components/SettingCard";

import { AgreementStateChip } from "../ProducerAgreementTable/AgreementStateChip";

const RouterLink = createLink(Link);

export function ProducerAgreementDetail({
  agreement,
}: {
  agreement: bffApi.ProducerAgreementDetails;
}) {
  return (
    <>
      <PageHeader
        actions={
          <Button hierarchy="danger" isDisabled kind="tonal" size="md">
            Suspend
          </Button>
        }
        resourceStatusChip={
          <AgreementStateChip state={agreement.state} type="light" />
        }
        title="Agreement request"
      />

      <div className="flex flex-col gap-4">
        <SettingsCard label="E-Service">
          <RouterLink
            params={{ id: agreement.eservice.id }}
            to="/production/e-services/$id"
            variant="inline"
          >
            {agreement.eservice.name.en}
          </RouterLink>
        </SettingsCard>

        <div className="grid grid-cols-2 gap-4">
          <SettingsCard label="Producer">
            {agreement.producer.name} - {agreement.producer.knodeId} Knode
          </SettingsCard>
          <SettingsCard label="Consumer">
            {agreement.consumer.name} - {agreement.consumer.knodeId} Knode
          </SettingsCard>
        </div>
      </div>
    </>
  );
}
