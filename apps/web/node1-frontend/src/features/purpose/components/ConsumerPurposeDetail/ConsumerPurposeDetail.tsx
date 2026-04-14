import type { bffApi } from "@knodia/bff-client";
import type { KnodeId } from "@knodia/common-models/ids";

import { Button, Modal, Pagination } from "@knodia/ui-kit/ui";
import { ArrowRightIcon } from "@phosphor-icons/react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { DialogTrigger } from "react-aria-components";
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
          canManagePurpose && <PurposeActionButton state={purpose.state} />
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
