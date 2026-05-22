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
import { match } from "ts-pattern";

import { ButtonLinkWithPreload } from "@/components/routerLinks";
import { useHasRole } from "@/contexts/auth";

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
  const canCreateKeychain = useHasRole("administrative");

  if (isLoading) {
    return <Loader className="mx-auto mt-20" label="Loading..." />;
  }

  if (keychains.length === 0) {
    return (
      <Empty
        className="mt-10"
        description={
          canCreateKeychain
            ? "Create your first one."
            : "New Keychains will appear here."
        }
        icon={<SelectionPlusIcon />}
        kind="brand-soft"
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
        <Column id="keys">Keys</Column>
        <Column id="members">Members</Column>
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
                {match(type)
                  .with("consumption", "api", (supportedType) => (
                    <ButtonLinkWithPreload
                      hierarchy="neutral"
                      kind="outlined"
                      params={{ id: keychain.id }}
                      size="icon-sm"
                      to={getKeychainDetailsHref(supportedType)}
                    >
                      <ArrowRightIcon />
                    </ButtonLinkWithPreload>
                  ))
                  .with("production", () => null)
                  .exhaustive()}
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
    .with("consumption", () => "/keychains/consumption/$id" as const)
    .with("api", () => "/keychains/api/$id" as const)
    .with("production", () => {
      throw new Error("Producer keychains are not supported yet.");
    })
    .exhaustive();
}
