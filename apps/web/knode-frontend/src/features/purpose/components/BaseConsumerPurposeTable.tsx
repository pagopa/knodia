import type { bffApi } from "@knodia/bff-client";

import {
  Cell,
  Column,
  Row,
  Table,
  TableBody,
  TableHeader,
} from "@knodia/ui-kit/ui";
import { ArrowRightIcon } from "@phosphor-icons/react";

import { KnodeAvatar } from "@/components/KnodeAvatar";
import { RecentlyUpdatedIcon } from "@/components/RecentlyUpdatedIcon";
import { ButtonLinkWithPreload } from "@/components/routerLinks";
import { formatNumericDate } from "@/utils/formatters";

import { PurposeStateChip } from "./PurposeStateChip";

type Variant = "active" | "archived";

export function BaseConsumerPurposeTable({
  purposes,
  variant,
}: {
  purposes: bffApi.ConsumerPurpose[];
  variant: Variant;
}) {
  const isArchived = variant === "archived";

  return (
    <Table
      aria-label={
        isArchived ? "Archived consumer purposes" : "Consumer purposes"
      }
    >
      <TableHeader>
        {isArchived && <Column id="archivingDate">Archiving date</Column>}
        <Column id="name" isRowHeader>
          Name
        </Column>
        <Column id="eservice">E-Service</Column>
        <Column id="producer">Producer</Column>
        <Column id="keychains">Keychains</Column>
        {!isArchived && (
          <>
            <Column id="status">Status</Column>
            <Column id="recentUpdate">
              <span className="sr-only">Recent update</span>
            </Column>
          </>
        )}
        <Column id="actions">
          <span className="sr-only">Actions</span>
        </Column>
      </TableHeader>
      <TableBody items={purposes}>
        {(purpose) => (
          <Row id={purpose.id}>
            {isArchived && (
              <Cell>
                <PurposeStateChip
                  label={formatNumericDate(purpose.updatedAt)}
                  state="Archived"
                />
              </Cell>
            )}
            <Cell className="body-md-em text-primary-light-mid-contrast">
              {purpose.name.en}
            </Cell>
            <Cell className="body-md text-primary-light-mid-contrast">
              {purpose.eservice.name.en}
            </Cell>
            <Cell>
              <KnodeAvatar
                className="bg-brand-dark text-white"
                knodeId={purpose.knodeId}
                name={purpose.producer.name}
                size="sm"
              />
            </Cell>
            <Cell className="body-md text-primary-light-mid-contrast">
              {purpose.keychains}
            </Cell>
            {!isArchived && (
              <>
                <Cell>
                  <PurposeStateChip state={purpose.state} type="bright" />
                </Cell>
                <Cell>
                  {purpose.hasRecentlyBeenUpdated && <RecentlyUpdatedIcon />}
                </Cell>
              </>
            )}
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
