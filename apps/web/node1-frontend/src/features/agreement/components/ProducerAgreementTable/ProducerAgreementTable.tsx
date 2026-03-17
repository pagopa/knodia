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

import type { ProducerAgreementState } from "@/features/agreement/models/types";

import { getOrganizationInitials } from "@/utils/getOrganizationInitials";

import { AgreementStateChip } from "./AgreementStateChip";

const ButtonLinkWithPreload = createLink(ButtonLink);

export function ProducerAgreementTable({
  agreements,
  isLoading,
}: {
  agreements: bffApi.ProducerAgreement[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return <Loader className="mx-auto mt-20" label="Loading..." />;
  }

  if (agreements.length === 0) {
    return (
      <Empty
        description="Agreements requested for your E-Services by Consumer Organizations will appear here."
        icon={<SelectionIcon />}
        title="There are no Agreements for your E-Services."
      />
    );
  }

  return (
    <Table aria-label="Producer agreements">
      <TableHeader>
        <Column isRowHeader>E-Service</Column>
        <Column>Consumer</Column>
        <Column>Status</Column>
        <Column />
      </TableHeader>
      <TableBody items={agreements}>
        {(agreement) => (
          <Row id={agreement.id}>
            <Cell className="body-md">{agreement.eservice.name.en}</Cell>
            <Cell>
              <div className="flex items-center gap-2">
                <Avatar
                  className="bg-brand-dark text-white"
                  fallback={getOrganizationInitials(agreement.consumer.name)}
                  name={agreement.consumer.name}
                  size="sm"
                />
              </div>
            </Cell>
            <Cell>
              <AgreementStateChip
                state={agreement.state as ProducerAgreementState}
              />
            </Cell>
            <Cell className="text-right">
              <ButtonLinkWithPreload
                aria-label="Go to agreement"
                hierarchy="neutral"
                kind="outlined"
                params={{ id: agreement.id }}
                size="icon-md"
                to="/production/agreements/$id"
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
