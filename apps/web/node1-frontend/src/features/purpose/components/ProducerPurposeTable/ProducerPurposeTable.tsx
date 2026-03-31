// TODO: replace ConsumerPurpose with ProducerPurpose when endpoint is renamed to /producer/purposes
import type { bffApi } from "@knodia/bff-client";

import {
  Avatar,
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

import { getInitials } from "@/utils/getInitials";

import { PurposeStateChip } from "../PurposeStateChip";

const ButtonLinkWithPreload = createLink(ButtonLink);

export function ProducerPurposeTable({
  isLoading,
  purposes,
}: {
  isLoading: boolean;
  purposes: bffApi.ConsumerPurpose[];
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
        <Column isRowHeader>Name</Column>
        <Column>E-Service</Column>
        <Column>Consumer</Column>
        <Column>Calls/Day</Column>
        <Column>Status</Column>
        <Column />
      </TableHeader>
      <TableBody items={purposes}>
        {(purpose) => (
          <Row id={purpose.id}>
            <Cell className="body-md-em text-primary-light-mid-contrast">
              {purpose.name.en}
            </Cell>
            {/* TODO: replace eserviceId with eservice name when BFF response is enriched */}
            <Cell className="body-md text-primary-light-mid-contrast">
              {purpose.eserviceId}
            </Cell>
            <Cell>
              {/* TODO: replace knodeId with consumer name when BFF response is enriched */}
              <Avatar
                className="bg-brand-dark text-white"
                fallback={getInitials(purpose.consumer.knodeId)}
                name={purpose.consumer.knodeId}
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
