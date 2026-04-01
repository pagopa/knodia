import type { bffApi } from "@knodia/bff-client";

import {
  ButtonLink,
  Cell,
  Column,
  Empty,
  Loader,
  Row,
  Table,
  TableBody,
  TableHeader,
} from "@knodia/ui-kit/ui";
import { ArrowRightIcon, SelectionIcon } from "@phosphor-icons/react";
import { createLink } from "@tanstack/react-router";

import { KnodeAvatar } from "@/components/KnodeAvatar";

import { PurposeStateChip } from "../PurposeStateChip";

const ButtonLinkWithPreload = createLink(ButtonLink);

export function ProducerPurposeTable({
  isLoading,
  purposes,
}: {
  isLoading: boolean;
  purposes: bffApi.ProducerPurpose[];
}) {
  if (isLoading) {
    return <Loader className="mx-auto mt-20" label="Loading..." />;
  }

  if (purposes.length === 0) {
    return (
      <Empty
        description="Purposes created for your E-Services by Consumer Organizations will appear here."
        icon={<SelectionIcon />}
        title="There are no Purposes for your E-Services yet."
      />
    );
  }

  return (
    <Table aria-label="Producer purposes">
      <TableHeader>
        <Column id="name" isRowHeader>
          Name
        </Column>
        <Column id="eservice">E-Service</Column>
        <Column id="consumer">Consumer</Column>
        <Column id="dailyCalls">Calls/Day</Column>
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
              {purpose.eservice.name.en}
            </Cell>
            <Cell>
              <KnodeAvatar
                className="bg-brand-dark text-white"
                knodeId={purpose.consumer.knodeId}
                name={purpose.consumer.name}
                size="sm"
              />
            </Cell>
            <Cell className="body-md text-primary-light-mid-contrast">
              {purpose.dailyCalls.toLocaleString()}
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
                size="icon-md"
                to="/production/purposes/$id"
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
