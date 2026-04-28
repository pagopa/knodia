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
import { ArrowRightIcon, SelectionPlusIcon } from "@phosphor-icons/react";

import { KnodeAvatar } from "@/components/KnodeAvatar";
import { RecentlyUpdatedIcon } from "@/components/RecentlyUpdatedIcon";
import { ButtonLinkWithPreload } from "@/components/routerLinks";
import { useHasRole } from "@/contexts/auth";

import { PurposeStateChip } from "../PurposeStateChip";

export function ConsumerPurposeTable({
  isLoading,
  purposes,
}: {
  isLoading: boolean;
  purposes: bffApi.ConsumerPurpose[];
}) {
  const canManagePurposes = useHasRole("administrative");
  if (isLoading) {
    return <Loader className="mx-auto mt-20" label="Loading..." />;
  }

  if (purposes.length === 0) {
    if (canManagePurposes) {
      return (
        <Empty
          action={{
            as: "link",
            hierarchy: "brand",
            href: { to: "/consumption/e-services" },
            kind: "filled",
            label: "See E-Services",
          }}
          description="You can create new Purposes for the E-Services for which you have an existing Agreement."
          icon={<SelectionPlusIcon />}
          kind="brand-soft"
          title="You don't have any Purpose yet."
        />
      );
    }

    return (
      <Empty
        description="Purposes will appear here."
        icon={<SelectionPlusIcon />}
        kind="brand-soft"
        title="There are no Purposes yet."
      />
    );
  }

  return (
    <Table aria-label="Consumer purposes">
      <TableHeader>
        <Column id="name" isRowHeader>
          Name
        </Column>
        <Column id="eservice">E-Service</Column>
        <Column id="producer">Producer</Column>
        <Column id="keychains">Keychains</Column>
        <Column id="status">Status</Column>
        <Column id="recentUpdate">
          <span className="sr-only">Recent update</span>
        </Column>
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
            <Cell>
              <PurposeStateChip state={purpose.state} type="bright" />
            </Cell>
            <Cell>
              {purpose.hasRecentlyBeenUpdated && <RecentlyUpdatedIcon />}
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
