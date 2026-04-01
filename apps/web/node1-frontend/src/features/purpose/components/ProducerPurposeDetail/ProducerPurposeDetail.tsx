import type { bffApi } from "@knodia/bff-client";

import { Button, ButtonLink, Link, Modal } from "@knodia/ui-kit/ui";
import { ArrowRightIcon } from "@phosphor-icons/react";
import { createLink } from "@tanstack/react-router";
import { DialogTrigger } from "react-aria-components";
import { match } from "ts-pattern";

import { OrganizationCard } from "@/components/OrganizationCard";
import { PageHeader } from "@/components/PageHeader";
import { useHasRole } from "@/contexts/auth";
import { AgreementCard } from "@/features/purpose/components/AgreementCard";
import { DailyCallsCard } from "@/features/purpose/components/DailyCallsCard";
import { EserviceCard } from "@/features/purpose/components/EserviceCard";
import { PurposeStateChip } from "@/features/purpose/components/PurposeStateChip";

const RouterLink = createLink(Link);
const RouterButtonLink = createLink(ButtonLink);

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
        <EserviceCard
          eservice={purpose.eservice}
          link={
            <RouterLink
              params={{ id: purpose.eservice.id }}
              to="/production/e-services/$id"
              variant="inline"
            >
              {purpose.eservice.name.en}
            </RouterLink>
          }
        />

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

        <DailyCallsCard
          dailyCalls={purpose.dailyCalls}
          maxDailyCallsPerConsumer={purpose.maxDailyCallsPerConsumer}
        />
      </div>

      <AgreementCard
        action={
          <RouterButtonLink
            aria-label="Go to agreement"
            hierarchy="neutral"
            kind="tonal"
            params={{ id: purpose.agreement.id }}
            size="icon-md"
            to="/production/agreements/$id"
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
