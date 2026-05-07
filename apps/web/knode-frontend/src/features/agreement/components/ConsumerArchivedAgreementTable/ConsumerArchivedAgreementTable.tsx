import type { bffApi } from "@knodia/bff-client";

import {
  Cell,
  Chip,
  Column,
  Empty,
  Loader,
  Row,
  Table,
  TableBody,
  TableHeader,
} from "@knodia/ui-kit/ui";
import { ArchiveIcon } from "@phosphor-icons/react";

import { RouterLink } from "@/components/routerLinks";
import { formatNumericDate } from "@/utils/formatters";

export function ConsumerArchivedAgreementTable({
  agreements,
  isLoading,
}: {
  agreements: bffApi.ConsumerAgreement[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return <Loader className="mx-auto mt-20" label="Loading..." />;
  }

  if (agreements.length === 0) {
    return (
      <Empty
        description="Archived Agreements will be displayed here."
        icon={<ArchiveIcon />}
        title="You haven't archived any Agreement yet."
      />
    );
  }

  return (
    <Table aria-label="Archived agreements">
      <TableHeader>
        <Column id="archivingDate">Archiving date</Column>
        <Column id="eservice" isRowHeader>
          E-Service
        </Column>
        <Column id="producerKnode">Producer Knode</Column>
        <Column id="producer">Producer</Column>
      </TableHeader>
      <TableBody items={agreements}>
        {(agreement) => (
          <Row id={agreement.id}>
            <Cell>
              <Chip
                icon={<ArchiveIcon />}
                kind="neutral"
                label={formatNumericDate(agreement.updatedAt)}
                type="light"
              />
            </Cell>
            <Cell className="body-md text-primary-light-mid-contrast">
              <RouterLink
                params={{ id: agreement.eservice.id }}
                search={{ knodeId: agreement.producer.knodeId }}
                to="/consumption/e-services/$id"
                variant="inline"
              >
                {agreement.eservice.name.en}
              </RouterLink>
            </Cell>
            <Cell className="body-md text-primary-light-mid-contrast">
              {agreement.producer.knodeId} Knode
            </Cell>
            <Cell className="body-md text-primary-light-mid-contrast">
              {agreement.producer.name}
            </Cell>
          </Row>
        )}
      </TableBody>
    </Table>
  );
}
