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

import { RecentlyUpdatedIcon } from "@/components/RecentlyUpdatedIcon";
import { ButtonLinkWithPreload } from "@/components/routerLinks";
import { AgreementStateChip } from "@/features/agreement/components/AgreementStateChip";

export function ConsumptionAgreementTable({
  agreements,
}: {
  agreements: bffApi.ProducerAgreement[];
}) {
  return (
    <Table aria-label="Recently updated agreements">
      <TableHeader>
        <Column id="knode" isRowHeader>
          Knode
        </Column>
        <Column id="consumer">Consumer</Column>
        <Column id="status">Status</Column>
        <Column id="recentUpdate">
          <span className="sr-only">Recent update</span>
        </Column>
        <Column id="actions">
          <span className="sr-only">Actions</span>
        </Column>
      </TableHeader>
      <TableBody items={agreements}>
        {(agreement) => (
          <Row id={agreement.id}>
            <Cell className="body-md">{agreement.consumer.knodeId} Knode</Cell>
            <Cell className="body-md">{agreement.consumer.name}</Cell>
            <Cell>
              <AgreementStateChip state={agreement.state} />
            </Cell>
            <Cell>
              <RecentlyUpdatedIcon />
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
