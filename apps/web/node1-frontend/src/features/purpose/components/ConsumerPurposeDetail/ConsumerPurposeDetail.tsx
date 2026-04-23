import type { bffApi } from "@knodia/bff-client";

import {
  type KnodeId,
  type PurposeId,
  unsafeBrandId,
} from "@knodia/common-models/ids";
import { Banner, Button, Pagination } from "@knodia/ui-kit/ui";
import { ArrowRightIcon } from "@phosphor-icons/react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { match } from "ts-pattern";

import { OrganizationCard } from "@/components/OrganizationCard";
import { PageHeader } from "@/components/PageHeader";
import { ButtonLinkWithPreload, RouterLink } from "@/components/routerLinks";
import { Section } from "@/components/Section";
import { useHasRole } from "@/contexts/auth";
import { PurposeAgreementCard } from "@/features/purpose/components/PurposeAgreementCard";
import { PurposeDailyCallsCard } from "@/features/purpose/components/PurposeDailyCallsCard";
import { PurposeEserviceCard } from "@/features/purpose/components/PurposeEserviceCard";
import { PurposeStateChip } from "@/features/purpose/components/PurposeStateChip";
import {
  ConsumerSuspendPurposeBody,
  SuspendPurposeModal,
} from "@/features/purpose/components/SuspendPurposeModal";
import { useReactivateConsumerPurpose } from "@/features/purpose/hooks/useReactivateConsumerPurpose";
import { useSuspendConsumerPurpose } from "@/features/purpose/hooks/useSuspendConsumerPurpose";

import { purposeLinkedConsumerKeychainsQuery } from "../../services/queries";
import { LinkConsumerKeychainAction } from "./LinkConsumerKeychainAction";
import { LinkedConsumerKeychainsTable } from "./LinkedConsumerKeychainsTable";

export function ConsumerPurposeDetail({
  knodeId,
  purpose,
}: {
  knodeId: KnodeId;
  purpose: bffApi.PurposeDetails;
}) {
  const canManagePurpose = useHasRole("administrative");

  const [offset, setOffset] = useState(0);
  const { data } = useQuery({
    ...purposeLinkedConsumerKeychainsQuery(purpose.id, knodeId, offset),
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <PageHeader
        actions={
          canManagePurpose && (
            <PurposeActionButton knodeId={knodeId} purpose={purpose} />
          )
        }
        description={purpose.description.en}
        resourceStatusChip={<PurposeStateChip state={purpose.state} />}
        title={purpose.name.en}
      />

      {purpose.suspendedByProducerAt !== null && <ProducerSuspendedBanner />}

      <div className="mt-10 flex flex-col gap-4">
        <PurposeEserviceCard
          eservice={purpose.eservice}
          link={
            <RouterLink
              params={{ id: purpose.eservice.id }}
              search={{ knodeId }}
              to="/consumption/e-services/$id"
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
            showContact={true}
          />
          <OrganizationCard
            label="Consumer"
            organization={purpose.consumer}
            showContact={false}
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
            aria-label="Go to E-Service"
            hierarchy="neutral"
            kind="tonal"
            params={{ id: purpose.eservice.id }}
            search={{ knodeId }}
            size="icon-md"
            to="/consumption/e-services/$id"
          >
            <ArrowRightIcon />
          </ButtonLinkWithPreload>
        }
        agreement={purpose.agreement}
      />

      <Section
        actions={
          canManagePurpose && (
            <LinkConsumerKeychainAction
              knodeId={knodeId}
              purposeId={purpose.id}
            />
          )
        }
        className="mt-10"
        title="Keychains"
      >
        <LinkedConsumerKeychainsTable
          canManagePurpose={canManagePurpose}
          isLoading={!data}
          keychains={data?.results ?? []}
          knodeId={knodeId}
          purposeId={purpose.id}
        />
        <Pagination
          className="mx-auto mt-6"
          limit={data?.pagination.limit ?? 0}
          offset={offset}
          onOffsetChange={(offset) => setOffset(offset)}
          totalItems={data?.pagination.total ?? 0}
        />
      </Section>
    </>
  );
}

function ProducerSuspendedBanner() {
  return (
    <Banner
      kind="warning"
      size="md"
      title="The Producer suspended this Purpose"
    >
      You can&apos;t reactivate this Purpose because it was suspended by the
      Producer, but you can create a new Purpose for the same E-Service.
    </Banner>
  );
}

function PurposeActionButton({
  knodeId,
  purpose,
}: {
  knodeId: KnodeId;
  purpose: bffApi.PurposeDetails;
}) {
  const purposeId = unsafeBrandId<PurposeId>(purpose.id);

  return match(purpose.state)
    .with("Active", () => (
      <SuspendConsumerPurposeButton knodeId={knodeId} purposeId={purposeId} />
    ))
    .with("Suspended", () =>
      purpose.suspendedByConsumerAt !== null ? (
        <ReactivateConsumerPurposeButton
          knodeId={knodeId}
          purposeId={purposeId}
        />
      ) : null,
    )
    .with("Archived", () => {
      console.warn("Unhandled purpose state: Archived");
      return null;
    })
    .exhaustive();
}

function ReactivateConsumerPurposeButton({
  knodeId,
  purposeId,
}: {
  knodeId: KnodeId;
  purposeId: PurposeId;
}) {
  const { isPending, reactivatePurpose } = useReactivateConsumerPurpose(
    purposeId,
    knodeId,
  );

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

function SuspendConsumerPurposeButton({
  knodeId,
  purposeId,
}: {
  knodeId: KnodeId;
  purposeId: PurposeId;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { isError, isPending, suspendPurpose } = useSuspendConsumerPurpose(
    purposeId,
    knodeId,
  );

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
      >
        <ConsumerSuspendPurposeBody />
      </SuspendPurposeModal>
    </>
  );
}
