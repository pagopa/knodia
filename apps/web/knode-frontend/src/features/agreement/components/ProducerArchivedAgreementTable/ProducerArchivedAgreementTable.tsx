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

import { RouterLink } from "@/components/routerLinks";
import { formatNumericDate } from "@/utils/formatters";

import { AgreementStateChip } from "../AgreementStateChip";

export function ProducerArchivedAgreementTable({
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
        description="Agreements archived by your Consumers will be displayed here."
        icon={<SelectionIcon />}
        kind="brand-soft"
        title="You don't have any archived Agreements yet."
      />
    );
  }

  return (
    <Table aria-label="Archived producer agreements">
      <TableHeader>
        <Column id="archivingDate">Archiving date</Column>
        <Column id="eservice" isRowHeader>
          E-Service
        </Column>
        <Column id="consumerKnode">Consumer Knode</Column>
        <Column id="consumer">Consumer</Column>
      </TableHeader>
      <TableBody items={agreements}>
        {(agreement) => (
          <Row id={agreement.id}>
            <Cell>
              <AgreementStateChip
                label={formatNumericDate(agreement.updatedAt)}
                state="Archived"
                type="light"
              />
            </Cell>
            <Cell className="body-md text-primary-light-mid-contrast">
              <RouterLink
                params={{ id: agreement.eservice.id }}
                to="/production/e-services/$id"
                variant="inline"
              >
                {agreement.eservice.name.en}
              </RouterLink>
            </Cell>
            <Cell className="body-md text-primary-light-mid-contrast">
              {agreement.consumer.knodeId} Knode
            </Cell>
            <Cell className="body-md text-primary-light-mid-contrast">
              {agreement.consumer.name}
            </Cell>
          </Row>
        )}
      </TableBody>
    </Table>
  );
}
