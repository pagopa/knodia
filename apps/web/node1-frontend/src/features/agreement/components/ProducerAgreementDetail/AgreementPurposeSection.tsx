import type { bffApi } from "@knodia/bff-client";
import type { AgreementId } from "@knodia/common-models/ids";

import {
  Banner,
  Cell,
  Column,
  Loader,
  Row,
  Table,
  TableBody,
  TableHeader,
} from "@knodia/ui-kit/ui";
import { ArrowRightIcon, SelectionPlusIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";

import { ButtonLinkWithPreload } from "@/components/routerLinks";
import { PurposeStateChip } from "@/features/purpose/components/PurposeStateChip";
import { producerPurposesByAgreementQuery } from "@/features/purpose/services/queries";

export function AgreementPurposeSection({
  agreementId,
}: {
  agreementId: AgreementId;
}) {
  const { data, isLoading } = useQuery(
    producerPurposesByAgreementQuery(agreementId),
  );
  const purposes = data?.results ?? [];

  return (
    <div className="mt-10 flex flex-col gap-6">
      <h3 className="headline-sm-em text-primary-light-high-contrast">
        Purposes
      </h3>
      <AgreementPurposeTable isLoading={isLoading} purposes={purposes} />
    </div>
  );
}

function AgreementPurposeTable({
  isLoading,
  purposes,
}: {
  isLoading: boolean;
  purposes: bffApi.ProducerPurpose[];
}) {
  if (isLoading) {
    return <Loader className="mx-auto mt-10" label="Loading..." />;
  }

  if (purposes.length === 0) {
    return (
      <Banner icon={<SelectionPlusIcon />} kind="neutral">
        No Purposes found for this Agreement.
      </Banner>
    );
  }

  return (
    <Table aria-label="Purposes for this Agreement">
      <TableHeader>
        <Column id="name" isRowHeader>
          Name
        </Column>
        <Column id="callsPerDay">Calls/Day</Column>
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
              {purpose.dailyCalls}
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
