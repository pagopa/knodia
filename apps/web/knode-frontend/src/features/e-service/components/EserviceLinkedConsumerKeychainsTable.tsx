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

import { ButtonLinkWithPreload } from "@/components/routerLinks";

interface EserviceLinkedConsumerKeychainsTableProps {
  isLoading: boolean;
  keychains: bffApi.Keychain[];
}

export function EserviceLinkedConsumerKeychainsTable({
  isLoading,
  keychains,
}: EserviceLinkedConsumerKeychainsTableProps) {
  if (isLoading) {
    return <Loader className="mx-auto mt-20" label="Loading..." />;
  }

  if (keychains.length === 0) {
    return (
      <Banner icon={<SelectionIcon />} kind="neutral">
        To request an access token for this E-Service, associate a Keychain to a
        Purpose from the Purpose page. Associated Keychains will appear here.
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
              <div className="flex justify-end">
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
