import type { bffApi } from "@knodia/bff-client";

import { type PurposeId, unsafeBrandId } from "@knodia/common-models/ids";
import { Banner, Button } from "@knodia/ui-kit/ui";
import { ArrowRightIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { match } from "ts-pattern";

import { OrganizationCard } from "@/components/OrganizationCard";
import { PageHeader } from "@/components/PageHeader";
import { ButtonLinkWithPreload, RouterLink } from "@/components/routerLinks";
import { useHasRole } from "@/contexts/auth";
import { PurposeAgreementCard } from "@/features/purpose/components/PurposeAgreementCard";
import { PurposeDailyCallsCard } from "@/features/purpose/components/PurposeDailyCallsCard";
import { PurposeEserviceCard } from "@/features/purpose/components/PurposeEserviceCard";
import { PurposeStateChip } from "@/features/purpose/components/PurposeStateChip";
import { SuspendPurposeModal } from "@/features/purpose/components/SuspendPurposeModal";
import { useReactivatePurposeByProducer } from "@/features/purpose/hooks/useReactivatePurposeByProducer";
import { useSuspendPurposeByProducer } from "@/features/purpose/hooks/useSuspendPurposeByProducer";

export function ProducerPurposeDetail({
  purpose,
}: {
  purpose: bffApi.PurposeDetails;
}) {
  const canManagePurposeState = useHasRole("administrative");
  const purposeId = unsafeBrandId<PurposeId>(purpose.id);

  return (
    <>
      <PageHeader
        actions={
          canManagePurposeState && <PurposeActionButton purpose={purpose} />
        }
        description={purpose.description.en}
        resourceStatusChip={<PurposeStateChip state={purpose.state} />}
        title={purpose.name.en}
      />

      {canManagePurposeState &&
        purpose.state === "Suspended" &&
        purpose.suspendedByConsumerAt !== null &&
        purpose.suspendedByProducerAt === null && (
          <ConsumerSuspendedBanner purposeId={purposeId} />
        )}

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

function ConsumerSuspendedBanner({ purposeId }: { purposeId: PurposeId }) {
  const [isOpen, setIsOpen] = useState(false);
  const { isError, isPending, suspendPurpose } =
    useSuspendPurposeByProducer(purposeId);

  return (
    <>
      <Banner
        action={{
          label: "Suspend to prevent reactivation",
          onPress: () => setIsOpen(true),
        }}
        kind="warning"
        size="md"
        title="The Consumer suspended this Purpose"
      >
        You can also suspend the Purpose on your side to prevent the Consumer
        from reactivating it.
      </Banner>
      <SuspendPurposeModal
        isError={isError}
        isOpen={isOpen}
        isPending={isPending}
        onConfirm={suspendPurpose}
        onOpenChange={setIsOpen}
        suspendActor="producer"
      />
    </>
  );
}

function PurposeActionButton({ purpose }: { purpose: bffApi.PurposeDetails }) {
  const purposeId = unsafeBrandId<PurposeId>(purpose.id);

  return match(purpose.state)
    .with("Active", () => (
      <SuspendPurposeByProducerButton purposeId={purposeId} />
    ))
    .with("Suspended", () =>
      purpose.suspendedByProducerAt !== null ? (
        <ReactivateProducerPurposeButton purposeId={purposeId} />
      ) : null,
    )
    .with("Archived", () => {
      console.warn("Unhandled purpose state: Archived");
      return null;
    })
    .exhaustive();
}

function ReactivateProducerPurposeButton({
  purposeId,
}: {
  purposeId: PurposeId;
}) {
  const { isPending, reactivatePurpose } =
    useReactivatePurposeByProducer(purposeId);

  return (
    <Button
      hierarchy="brand"
      isPending={isPending}
      kind="filled"
      onPress={reactivatePurpose}
      size="md"
    >
      Reactivate
    </Button>
  );
}

function SuspendPurposeByProducerButton({
  purposeId,
}: {
  purposeId: PurposeId;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { isError, isPending, suspendPurpose } =
    useSuspendPurposeByProducer(purposeId);

  return (
    <>
      <Button
        hierarchy="danger"
        kind="tonal"
        onPress={() => setIsOpen(true)}
        size="md"
      >
        Suspend
      </Button>
      <SuspendPurposeModal
        isError={isError}
        isOpen={isOpen}
        isPending={isPending}
        onConfirm={suspendPurpose}
        onOpenChange={setIsOpen}
        suspendActor="producer"
      />
    </>
  );
}
