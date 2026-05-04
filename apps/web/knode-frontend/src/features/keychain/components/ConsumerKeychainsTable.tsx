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
import { ArrowRightIcon } from "@phosphor-icons/react";
import { type ReactNode } from "react";

import { ButtonLinkWithPreload } from "@/components/routerLinks";

interface ConsumerKeychainsTableProps {
  emptyState: {
    icon: ReactNode;
    message: ReactNode;
  };
  isLoading: boolean;
  keychains: bffApi.Keychain[];
  rowActions?: (keychain: bffApi.Keychain) => ReactNode;
}

export function ConsumerKeychainsTable({
  emptyState,
  isLoading,
  keychains,
  rowActions,
}: ConsumerKeychainsTableProps) {
  if (isLoading) {
    return <Loader className="mx-auto mt-20" label="Loading..." />;
  }

  if (keychains.length === 0) {
    return (
      <Banner icon={emptyState.icon} kind="neutral">
        {emptyState.message}
      </Banner>
    );
  }

  return (
    <Table aria-label="Keychains table">
      <TableHeader>
        <Column id="name" isRowHeader>
          Name
        </Column>
        <Column id="keys">Keys</Column>
        <Column id="actions">
          <span className="sr-only">Actions</span>
        </Column>
      </TableHeader>
      <TableBody items={keychains}>
        {(keychain) => (
          <Row id={keychain.id}>
            <Cell>
              <span className="body-md-em">{keychain.name.en}</span>
            </Cell>
            <Cell>{keychain.keysCount}</Cell>
            <Cell>
              <div className="flex justify-end items-center gap-2">
                {rowActions?.(keychain)}
                <ButtonLinkWithPreload
                  hierarchy="neutral"
                  kind="outlined"
                  params={{ id: keychain.id }}
                  size="icon-sm"
                  to="/keychains/consumption/$id"
                >
                  <ArrowRightIcon />
                </ButtonLinkWithPreload>
              </div>
            </Cell>
          </Row>
        )}
      </TableBody>
    </Table>
  );
}
