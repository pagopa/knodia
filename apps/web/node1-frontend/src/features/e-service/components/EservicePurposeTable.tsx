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
import { createLink, useNavigate } from "@tanstack/react-router";

import { PurposeStateChip } from "@/features/purpose/components/PurposeStateChip";

const ButtonLinkWithPreload = createLink(ButtonLink);

export function EservicePurposeTable({
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
