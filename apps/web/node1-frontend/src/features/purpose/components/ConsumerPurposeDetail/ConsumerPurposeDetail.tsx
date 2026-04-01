import type { bffApi } from "@knodia/bff-client";
import type { KnodeId } from "@knodia/common-models/ids";

import { Button, ButtonLink, Link, Modal } from "@knodia/ui-kit/ui";
import { ArrowRightIcon } from "@phosphor-icons/react";
import { createLink } from "@tanstack/react-router";
import { DialogTrigger } from "react-aria-components";
import { match } from "ts-pattern";

import { OrganizationCard } from "@/components/OrganizationCard";
import { PageHeader } from "@/components/PageHeader";
import { SettingsCard } from "@/components/SettingCard";
import { useHasRole } from "@/contexts/auth";
import { EserviceStateChip } from "@/features/e-service/components/EserviceStateChip";
import { AgreementCard } from "@/features/purpose/components/AgreementCard";
import { DailyCallsCard } from "@/features/purpose/components/DailyCallsCard";
import { PurposeStateChip } from "@/features/purpose/components/PurposeStateChip";

const RouterLink = createLink(Link);
const RouterButtonLink = createLink(ButtonLink);

export function ConsumerPurposeDetail({
  knodeId,
  purpose,
}: {
  knodeId: KnodeId;
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
              search={{ knodeId }}
              to="/consumption/e-services/$id"
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
            showContact={true}
          />
          <OrganizationCard
            label="Consumer"
            organization={purpose.consumer}
            showContact={false}
          />
        </div>

        <DailyCallsCard
          dailyCalls={purpose.dailyCalls}
          maxDailyCallsPerConsumer={purpose.maxDailyCallsPerConsumer}
        />
      </div>

      <AgreementCard
        action={
          <RouterButtonLink
            aria-label="Go to E-Service"
            hierarchy="neutral"
            kind="tonal"
            params={{ id: purpose.eservice.id }}
            search={{ knodeId }}
            size="icon-md"
            to="/consumption/e-services/$id"
          >
            <ArrowRightIcon />
          </RouterButtonLink>
        }
        agreement={purpose.agreement}
      />
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
          description="If you suspend it, you will no longer be able to use the associated E-Service for this Purpose. Are you sure you want to suspend this Purpose? You will be able to reactivate it later."
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
