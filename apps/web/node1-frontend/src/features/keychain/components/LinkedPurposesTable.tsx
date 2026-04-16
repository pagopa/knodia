import type { bffApi } from "@knodia/bff-client";

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
import { ArrowRightIcon, SelectionIcon } from "@phosphor-icons/react";

import { KnodeAvatar } from "@/components/KnodeAvatar";
import { ButtonLinkWithPreload } from "@/components/routerLinks";
import { PurposeStateChip } from "@/features/purpose/components/PurposeStateChip";

interface LinkedPurposesTableProps {
  isLoading: boolean;
  keychainId: string;
  purposes: bffApi.ConsumerKeychainPurpose[];
}

export function LinkedPurposesTable({
  isLoading,
  purposes,
}: LinkedPurposesTableProps) {
  if (isLoading) {
    return <Loader className="mx-auto mt-20" label="Loading..." />;
  }

  if (purposes.length === 0) {
    return (
      <Banner icon={<SelectionIcon />} kind="neutral">
        There are no Purpose linked to this Keychain yet.
      </Banner>
    );
  }

  return (
    <Table aria-label="Linked Purposes table">
      <TableHeader>
        <Column id="name" isRowHeader>
          Name
        </Column>
        <Column id="e-service">E-Service</Column>
        <Column id="producer">Producer</Column>
        <Column id="status">Status</Column>
        <Column id="actions">
          <span className="sr-only">Actions</span>
        </Column>
      </TableHeader>
      <TableBody items={purposes}>
        {(purpose) => (
          <Row id={purpose.id}>
            <Cell>
              <span className="body-md-em">{purpose.name.en}</span>
            </Cell>
            <Cell>{purpose.eserviceName.en}</Cell>
            <Cell>
              <KnodeAvatar
                className="bg-brand-dark text-white"
                knodeId={purpose.knodeId}
                name={purpose.producerName}
                size="sm"
              />
            </Cell>
            <Cell>
              <PurposeStateChip state={purpose.state} />
            </Cell>
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
