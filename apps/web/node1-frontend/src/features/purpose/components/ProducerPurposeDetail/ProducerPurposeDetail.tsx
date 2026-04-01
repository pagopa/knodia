import type { bffApi } from "@knodia/bff-client";

import { Button, Link, Modal } from "@knodia/ui-kit/ui";
import { createLink } from "@tanstack/react-router";
import { DialogTrigger } from "react-aria-components";
import { match } from "ts-pattern";

import { OrganizationCard } from "@/components/OrganizationCard";
import { PageHeader } from "@/components/PageHeader";
import { SettingsCard } from "@/components/SettingCard";
import { useHasRole } from "@/contexts/auth";
import { AgreementCard } from "@/features/agreement/components/AgreementCard";
import { EserviceStateChip } from "@/features/e-service/components/EserviceStateChip";
import { PurposeStateChip } from "@/features/purpose/components/PurposeStateChip";
import { formatNumber } from "@/utils/formatters";

const RouterLink = createLink(Link);

export function ProducerPurposeDetail({
  purpose,
}: {
  purpose: bffApi.PurposeDetails;
}) {
  const canManagePurposeState = useHasRole("administrative");

  return (
    <>
      <PageHeader
        actions={
          canManagePurposeState && <PurposeActionButton state={purpose.state} />
        }
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
          <OrganizationCard
            label="Producer"
            organization={purpose.producer}
            showContact={false}
          />
          <OrganizationCard
            label="Consumer"
            organization={purpose.consumer}
            showContact={true}
          />
        </div>

        <SettingsCard label="Declared API calls per day">
          {formatNumber(purpose.dailyCalls)}{" "}
          <span className="title-md font-normal">
            (max {formatNumber(purpose.maxDailyCallsPerConsumer)})
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
      <DialogTrigger>
        <Button hierarchy="danger" isDisabled kind="tonal" size="md">
          Suspend
        </Button>
        <Modal
          actionLabel="Suspend anyway"
          description="If you suspend it, the Consumer won't be able to use the associated E-Service for this Purpose. Are you sure you want to suspend this Purpose? You will be able to reactivate it later."
          isDismissable
          kind="destructive"
          // eslint-disable-next-line @typescript-eslint/no-empty-function -- TODO: implement suspend mutation
          onConfirm={() => {}}
          title="Suspend Purpose"
        />
      </DialogTrigger>
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
