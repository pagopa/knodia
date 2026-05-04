import type { bffApi } from "@knodia/bff-client";

import {
  Cell,
  Column,
  Loader,
  Row,
  Table,
  TableBody,
  TableHeader,
} from "@knodia/ui-kit/ui";
import { ArchiveIcon, ArrowRightIcon } from "@phosphor-icons/react";

import { KnodeAvatar } from "@/components/KnodeAvatar";
import { ButtonLinkWithPreload } from "@/components/routerLinks";
import { formatNumericDate } from "@/utils/formatters";

export function ArchivedConsumerPurposeTable({
  isLoading,
  purposes,
}: {
  isLoading: boolean;
  purposes: bffApi.ConsumerPurpose[];
}) {
  if (isLoading) {
    return <Loader className="mx-auto mt-20" label="Loading..." />;
  }

  return (
    <Table aria-label="Archived consumer purposes">
      <TableHeader>
        <Column id="archivingDate">Archiving date</Column>
        <Column id="name" isRowHeader>
          Name
        </Column>
        <Column id="eservice">E-Service</Column>
        <Column id="producer">Producer</Column>
        <Column id="keychains">Keychains</Column>
        <Column id="actions">
          <span className="sr-only">Actions</span>
        </Column>
      </TableHeader>
      <TableBody items={purposes}>
        {(purpose) => (
          <Row id={purpose.id}>
            <Cell className="body-md text-primary-light-mid-contrast">
              <span className="inline-flex items-center gap-2">
                <ArchiveIcon />
                {formatNumericDate(purpose.updatedAt)}
              </span>
            </Cell>
            <Cell className="body-md-em text-primary-light-mid-contrast">
              {purpose.name.en}
            </Cell>
            <Cell className="body-md text-primary-light-mid-contrast">
              {purpose.eservice.name.en}
            </Cell>
            <Cell>
              <KnodeAvatar
                className="bg-brand-dark text-white"
                knodeId={purpose.producer.knodeId}
                name={purpose.producer.name}
                size="sm"
              />
            </Cell>
            <Cell className="body-md text-primary-light-mid-contrast">
              {purpose.keychains}
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
