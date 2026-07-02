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
import { ArrowRightIcon } from "@phosphor-icons/react";
import { type ReactNode } from "react";

import { ButtonLinkWithPreload } from "@/components/routerLinks";

interface ProducerKeychainsTableProps {
  emptyState: ReactNode;
  isLoading: boolean;
  keychains: bffApi.Keychain[];
  rowActions?: (keychain: bffApi.Keychain) => ReactNode;
}

export function ProducerKeychainsTable({
  emptyState,
  isLoading,
  keychains,
  rowActions,
}: ProducerKeychainsTableProps) {
  if (isLoading) {
    return <Loader className="mx-auto mt-20" label="Loading..." />;
  }

  if (keychains.length === 0) {
    return <>{emptyState}</>;
  }

  return (
    <Table aria-label="Keychains table">
      <TableHeader>
        <Column id="name" isRowHeader>
          Name
        </Column>
        <Column id="type">Type</Column>
        <Column id="keys">Keys</Column>
        <Column id="actions">
          <span className="sr-only">Actions</span>
        </Column>
      </TableHeader>
      <TableBody items={keychains}>
        {(keychain) => (
          <Row id={keychain.id}>
            <Cell>
              <span className="body-md-em text-primary-light-mid-contrast">
                {keychain.name.en}
              </span>
            </Cell>
            <Cell className="body-md text-primary-light-mid-contrast">
              Production
            </Cell>
            <Cell className="body-md text-primary-light-mid-contrast">
              {keychain.keysCount}
            </Cell>
            <Cell>
              <div className="flex justify-end items-center gap-2">
                {rowActions?.(keychain)}
                <ButtonLinkWithPreload
                  aria-label={`Go to keychain ${keychain.name.en}`}
                  hierarchy="neutral"
                  kind="outlined"
                  params={{ id: keychain.id }}
                  size="icon-sm"
                  to="/keychains/production/$id"
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
