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

  // Consumer Keychains link Purposes, Producer Keychains link E-services;
  // Knode API Keychains have no linked-resource counter.
  const linkedColumn = match(type)
    .with("consumption", () => ({
      getCount: (keychain: bffApi.Keychain) => keychain.purposesCount,
      id: "purposes" as const,
      label: "Purposes",
    }))
    .with("production", () => ({
      getCount: (keychain: bffApi.Keychain) => keychain.eservicesCount,
      id: "eservices" as const,
      label: "E-services",
    }))
    .with("api", () => null)
    .exhaustive();

  return (
    <Table aria-label="Keychains table">
      <TableHeader>
        <Column id="name" isRowHeader>
          Name
        </Column>
        <Column id="keys">Keys</Column>
        <Column id="members">Members</Column>
        {linkedColumn && (
          <Column id={linkedColumn.id}>{linkedColumn.label}</Column>
        )}
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
            {linkedColumn && (
              <Cell>{linkedColumn.getCount(keychain) ?? 0}</Cell>
            )}
            <Cell>
              <div className="flex justify-end">
                <ButtonLinkWithPreload
                  hierarchy="neutral"
                  kind="outlined"
                  params={{ id: keychain.id }}
                  size="icon-sm"
                  to={getKeychainDetailsHref(type)}
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

function getKeychainDetailsHref(type: KeychainType) {
  return match(type)
    .with("consumption", () => "/keychains/consumption/$id" as const)
    .with("api", () => "/keychains/api/$id" as const)
    .with("production", () => "/keychains/production/$id" as const)
    .exhaustive();
}
