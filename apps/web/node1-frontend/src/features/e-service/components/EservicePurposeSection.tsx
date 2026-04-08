import type { bffApi } from "@knodia/bff-client";
import type { EserviceId, KnodeId } from "@knodia/common-models/ids";

import {
  Banner,
  ButtonLink,
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
import { createLink, useNavigate } from "@tanstack/react-router";

import { useHasRole } from "@/contexts/auth";
import { PurposeStateChip } from "@/features/purpose/components/PurposeStateChip";
import { consumerPurposesByEserviceQuery } from "@/features/purpose/services/queries";

const ButtonLinkWithPreload = createLink(ButtonLink);

export function EservicePurposeSection({
  eserviceId,
  knodeId,
}: {
  eserviceId: EserviceId;
  knodeId: KnodeId;
}) {
  const canManageConsumption = useHasRole("administrative");
  const { data, isLoading } = useQuery(
    consumerPurposesByEserviceQuery(eserviceId),
  );
  const purposes = data?.results ?? [];

  return (
    <div className={`mt-4 flex flex-col gap-6`}>
      <div className="flex items-center justify-between">
        <h3 className="title-md-em text-primary-light-low-contrast">
          Purposes
        </h3>
        {canManageConsumption && purposes.length > 0 && (
          <ButtonLinkWithPreload
            hierarchy="neutral"
            kind="tonal"
            params={{ id: eserviceId }}
            search={{ knodeId }}
            size="sm"
            to="/consumption/e-services/$id/purposes/new"
          >
            Create Purpose
          </ButtonLinkWithPreload>
        )}
      </div>
      <EservicePurposeTable
        canManageConsumption={canManageConsumption}
        eserviceId={eserviceId}
        isLoading={isLoading}
        knodeId={knodeId}
        purposes={purposes}
      />
    </div>
  );
}

function EservicePurposeTable({
  canManageConsumption,
  eserviceId,
  isLoading,
  knodeId,
  purposes,
}: {
  canManageConsumption: boolean;
  eserviceId: EserviceId;
  isLoading: boolean;
  knodeId: KnodeId;
  purposes: bffApi.ConsumerPurpose[];
}) {
  const navigate = useNavigate();

  if (isLoading) {
    return <Loader className="mx-auto mt-10" label="Loading..." />;
  }

  if (purposes.length === 0) {
    return (
      <Banner
        action={
          canManageConsumption
            ? {
                label: "Create Purpose",
                onPress: () =>
                  navigate({
                    params: { id: eserviceId },
                    search: { knodeId },
                    to: "/consumption/e-services/$id/purposes/new",
                  }),
              }
            : undefined
        }
        icon={<SelectionPlusIcon />}
        kind="neutral"
      >
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
            {/* TODO(KN-406): replace with actual keychain count */}
            <Cell className="body-md text-primary-light-mid-contrast">-</Cell>
            <Cell>
              <PurposeStateChip state={purpose.state} type="bright" />
            </Cell>
            <Cell className="text-right">
              <ButtonLinkWithPreload
                aria-label="Go to purpose"
                hierarchy="neutral"
                kind="outlined"
                params={{ id: purpose.id }}
                search={{ knodeId: purpose.producer.knodeId }}
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
