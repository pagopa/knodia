import type { bffApi } from "@knodia/bff-client";

import {
  Cell,
  Column,
  Empty,
  Loader,
  Row,
  Table,
  TableBody,
  TableHeader,
} from "@knodia/ui-kit/ui";
import { SelectionIcon } from "@phosphor-icons/react";

import { KnodeAvatar } from "@/components/KnodeAvatar";
import { formatNumericDate } from "@/utils/formatters";

import { PurposeStateChip } from "../PurposeStateChip";

export function ProducerArchivedPurposeTable({
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
        description="Purposes archived by your Consumers will be displayed here."
        icon={<SelectionIcon />}
        kind="brand-soft"
        title="You don't have any archived Purposes yet."
      />
    );
  }

  return (
    <Table aria-label="Archived producer purposes">
      <TableHeader>
        <Column id="archivingDate">Archiving date</Column>
        <Column id="name" isRowHeader>
          Name
        </Column>
        <Column id="eservice">E-Service</Column>
        <Column id="consumer">Consumer</Column>
      </TableHeader>
      <TableBody items={purposes}>
        {(purpose) => (
          <Row id={purpose.id}>
            <Cell>
              <PurposeStateChip
                label={formatNumericDate(purpose.updatedAt)}
                state="Archived"
              />
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
                knodeId={purpose.consumer.knodeId}
                name={purpose.consumer.name}
                size="sm"
              />
            </Cell>
          </Row>
        )}
      </TableBody>
    </Table>
  );
}
