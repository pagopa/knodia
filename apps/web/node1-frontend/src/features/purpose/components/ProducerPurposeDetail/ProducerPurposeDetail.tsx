import type { bffApi } from "@knodia/bff-client";

import { Button, Modal } from "@knodia/ui-kit/ui";
import { ArrowRightIcon } from "@phosphor-icons/react";
import { DialogTrigger } from "react-aria-components";
import { match } from "ts-pattern";

import { OrganizationCard } from "@/components/OrganizationCard";
import { PageHeader } from "@/components/PageHeader";
import { ButtonLinkWithPreload, RouterLink } from "@/components/routerLinks";
import { useHasRole } from "@/contexts/auth";
import { PurposeAgreementCard } from "@/features/purpose/components/PurposeAgreementCard";
import { PurposeDailyCallsCard } from "@/features/purpose/components/PurposeDailyCallsCard";
import { PurposeEserviceCard } from "@/features/purpose/components/PurposeEserviceCard";
import { PurposeStateChip } from "@/features/purpose/components/PurposeStateChip";

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
        <PurposeEserviceCard
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

        <PurposeDailyCallsCard
          dailyCalls={purpose.dailyCalls}
          maxDailyCallsPerConsumer={purpose.maxDailyCallsPerConsumer}
        />
      </div>

      <PurposeAgreementCard
        action={
          <ButtonLinkWithPreload
            aria-label="Go to agreement"
            hierarchy="neutral"
            kind="tonal"
            params={{ id: purpose.agreement.id }}
            size="icon-md"
            to="/production/agreements/$id"
          >
            <ArrowRightIcon />
          </ButtonLinkWithPreload>
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
          cancelLabel="Cancel"
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
