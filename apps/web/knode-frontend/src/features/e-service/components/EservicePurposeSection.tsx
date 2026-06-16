import type { bffApi } from "@knodia/bff-client";
import type { EserviceId, KnodeId } from "@knodia/common-models/ids";

import {
  Banner,
  Cell,
  Column,
  Loader,
  Row,
  Table,
  TableBody,
  TableHeader,
} from "@knodia/ui-kit/ui";
import { ArrowRightIcon, SelectionPlusIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";

import { ButtonLinkWithPreload } from "@/components/routerLinks";
import { useHasRole } from "@/contexts/auth";
import { CreatePurposeButton } from "@/features/purpose/components/CreatePurposeButton";
import { PurposeStateChip } from "@/features/purpose/components/PurposeStateChip";
import { useCreatePurposeAction } from "@/features/purpose/hooks/useCreatePurposeAction";
import { consumerPurposesByEserviceQuery } from "@/features/purpose/services/queries";

export function EservicePurposeSection({
  agreementState,
  eserviceId,
  eserviceMode,
  eserviceState,
  knodeId,
}: {
  agreementState: bffApi.AgreementState;
  eserviceId: EserviceId;
  eserviceMode: bffApi.EserviceMode;
  eserviceState: bffApi.EserviceVersionState;
  knodeId: KnodeId;
}) {
  const canManageConsumption = useHasRole("administrative");
  const { data, isLoading } = useQuery(
    consumerPurposesByEserviceQuery(eserviceId),
  );
  const purposes = data?.results ?? [];

  const { blockedModal, isBlocked, onBlockedPress } = useCreatePurposeAction({
    agreementState,
    eserviceState,
  });

  return (
    <div className="mt-4 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h3 className="title-md-em text-primary-light-low-contrast">
          Purposes
        </h3>
        {canManageConsumption && (
          <CreatePurposeButton
            eserviceId={eserviceId}
            eserviceMode={eserviceMode}
            isBlocked={isBlocked}
            knodeId={knodeId}
            onBlockedPress={onBlockedPress}
          />
        )}
      </div>
      <EservicePurposeTable isLoading={isLoading} purposes={purposes} />
      {blockedModal}
    </div>
  );
}

function EservicePurposeTable({
  isLoading,
  purposes,
}: {
  isLoading: boolean;
  purposes: bffApi.ConsumerPurpose[];
}) {
  if (isLoading) {
    return <Loader className="mx-auto mt-10" label="Loading..." />;
  }

  if (purposes.length === 0) {
    return (
      <Banner icon={<SelectionPlusIcon />} kind="neutral">
        You don&apos;t have any Purpose for this E-Service.
      </Banner>
    );
  }

  return (
    <Table aria-label="Purposes for this E-Service">
      <TableHeader>
        <Column id="name" isRowHeader>
          Name
        </Column>
        <Column id="keychains">Keychains</Column>
        <Column id="status">Status</Column>
        <Column id="actions">
          <span className="sr-only">Actions</span>
        </Column>
      </TableHeader>
      <TableBody items={purposes}>
        {(purpose) => (
          <Row id={purpose.id}>
            <Cell className="body-md-em text-primary-light-mid-contrast">
              {purpose.name.en}
            </Cell>
            <Cell className="body-md text-primary-light-mid-contrast">
              {purpose.keychains}
            </Cell>
            <Cell>
              <PurposeStateChip state={purpose.state} type="bright" />
            </Cell>
            <Cell className="text-right">
              <ButtonLinkWithPreload
                aria-label="Go to purpose"
                hierarchy="neutral"
                kind="outlined"
                params={{ id: purpose.id }}
                search={{ knodeId: purpose.knodeId }}
                size="icon-md"
                to="/consumption/purposes/$id"
              >
                <ArrowRightIcon />
              </ButtonLinkWithPreload>
            </Cell>
          </Row>
        )}
      </TableBody>
    </Table>
  );
}
