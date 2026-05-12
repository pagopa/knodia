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
import { ArchivePurposeModal } from "@/features/purpose/components/ArchivePurposeModal";
import { PurposeAgreementCard } from "@/features/purpose/components/PurposeAgreementCard";
import { PurposeDailyCallsCard } from "@/features/purpose/components/PurposeDailyCallsCard";
import { PurposeEserviceCard } from "@/features/purpose/components/PurposeEserviceCard";
import { PurposeStateChip } from "@/features/purpose/components/PurposeStateChip";
import { SuspendPurposeModal } from "@/features/purpose/components/SuspendPurposeModal";
import { useArchivePurposeByConsumer } from "@/features/purpose/hooks/useArchivePurposeByConsumer";
import { useReactivatePurposeByConsumer } from "@/features/purpose/hooks/useReactivatePurposeByConsumer";
import { useSuspendPurposeByConsumer } from "@/features/purpose/hooks/useSuspendPurposeByConsumer";
import { formatNumericDate } from "@/utils/formatters";

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
  const isArchived = purpose.state === "Archived";

  const [offset, setOffset] = useState(0);
  const { data } = useQuery({
    ...purposeLinkedConsumerKeychainsQuery(purpose.id, knodeId, offset),
    placeholderData: keepPreviousData,
  });

  const headerActions = isArchived ? (
    <PurposeStateChip
      label={`Archived ${formatNumericDate(purpose.updatedAt)}`}
      state="Archived"
    />
  ) : (
    canManagePurpose && (
      <PurposeActionButton knodeId={knodeId} purpose={purpose} />
    )
  );
  const headerStatusChip = isArchived ? undefined : (
    <PurposeStateChip state={purpose.state} />
  );

  return (
    <>
      <PageHeader
        actions={headerActions}
        copyableId={purpose.id}
        description={purpose.description.en}
        resourceStatusChip={headerStatusChip}
        title={purpose.name.en}
      />

      {purpose.state === "Suspended" &&
        purpose.suspendedByConsumerAt === null &&
        purpose.suspendedByProducerAt !== null && <ProducerSuspendedBanner />}

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
          canManagePurpose &&
          !isArchived && (
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

function ArchiveConsumerPurposeButton({
  knodeId,
  purposeId,
}: {
  knodeId: KnodeId;
  purposeId: PurposeId;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { archivePurpose, isError, isPending } = useArchivePurposeByConsumer(
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
        Archive
      </Button>
      <ArchivePurposeModal
        isError={isError}
        isOpen={isOpen}
        isPending={isPending}
        onConfirm={archivePurpose}
        onOpenChange={setIsOpen}
      />
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
      <SuspendPurposeByConsumerButton knodeId={knodeId} purposeId={purposeId} />
    ))
    .with("Suspended", () => (
      <SuspendedConsumerActions knodeId={knodeId} purpose={purpose} />
    ))
    .with("Archived", () => null)
    .exhaustive();
}

function ReactivatePurposeByConsumerButton({
  knodeId,
  purposeId,
}: {
  knodeId: KnodeId;
  purposeId: PurposeId;
}) {
  const { isPending, reactivatePurpose } = useReactivatePurposeByConsumer(
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

function SuspendedConsumerActions({
  knodeId,
  purpose,
}: {
  knodeId: KnodeId;
  purpose: bffApi.PurposeDetails;
}) {
  const purposeId = unsafeBrandId<PurposeId>(purpose.id);
  const canReactivate =
    purpose.suspendedByConsumerAt !== null &&
    purpose.suspendedByProducerAt === null;

  return (
    <>
      {canReactivate && (
        <ReactivatePurposeByConsumerButton
          knodeId={knodeId}
          purposeId={purposeId}
        />
      )}
      <ArchiveConsumerPurposeButton knodeId={knodeId} purposeId={purposeId} />
    </>
  );
}

function SuspendPurposeByConsumerButton({
  knodeId,
  purposeId,
}: {
  knodeId: KnodeId;
  purposeId: PurposeId;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { isError, isPending, suspendPurpose } = useSuspendPurposeByConsumer(
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
        suspendActor="consumer"
      />
    </>
  );
}
