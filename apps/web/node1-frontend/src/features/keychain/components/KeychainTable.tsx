import type { bffApi } from "@knodia/bff-client";

import {
  ButtonLink,
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
import { match } from "ts-pattern";

import type { KeychainType } from "../models/commons";

interface KeychainTableProps {
  isLoading: boolean;
  keychains: bffApi.Keychain[];
  type: KeychainType;
}

export function KeychainTable({
  isLoading,
  keychains,
  type,
}: KeychainTableProps) {
  if (isLoading) {
    return <Loader className="mx-auto mt-20" label="Loading..." />;
  }

  if (keychains.length === 0) {
    return (
      <Empty
        className="mt-10"
        description="Create your first one"
        icon={<SelectionPlusIcon />}
        title="You don't have any Keychains yet"
      />
    );
  }

  return (
    <Table aria-label="Keychains table">
      <TableHeader>
        <Column id="name" isRowHeader>
          Name
        </Column>
        <Column id="type">Keys</Column>
        <Column id="numKeys">Members</Column>
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
            <Cell>{keychain.membersCount}</Cell>
            <Cell>
              <div className="flex justify-end">
                <ButtonLink
                  hierarchy="neutral"
                  href={{
                    params: { id: keychain.id },
                    to: getKeychainDetailsHref(type),
                  }}
                  kind="outlined"
                  size="icon-sm"
                >
                  <ArrowRightIcon />
                </ButtonLink>
              </div>
            </Cell>
          </Row>
        )}
      </TableBody>
    </Table>
  );
}

function getKeychainDetailsHref(type: KeychainType) {
  return match(type)
    .with("consumer", () => "/keychains/consumption/$id" as const)
    .with("producer", () => {
      throw new Error("Producer keychains are not supported yet.");
    })
    .with("api", () => {
      throw new Error("API keychains are not supported yet.");
    })
    .exhaustive();
}
