import type { SortDescriptor } from "react-aria-components";

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
import {
  ArrowRightIcon,
  MagnifyingGlassIcon,
  SelectionPlusIcon,
} from "@phosphor-icons/react";

interface KeychainTableProps {
  hasAppliedFilters: boolean;
  isLoading: boolean;
  keychains: {
    id: string;
    name: string;
    numKeys: number;
    type: string;
  }[];
  onSortChange?: (descriptor: SortDescriptor) => void;
  sortDescriptor?: SortDescriptor;
}

export function KeychainTable({
  hasAppliedFilters,
  isLoading,
  keychains,
  onSortChange,
  sortDescriptor,
}: KeychainTableProps) {
  if (isLoading) {
    return <Loader className="mx-auto mt-20" label="Loading..." />;
  }

  if (keychains.length === 0) {
    return <EmptyState hasAppliedFilters={hasAppliedFilters} />;
  }

  return (
    <Table
      aria-label="Keychains table"
      onSortChange={onSortChange}
      sortDescriptor={sortDescriptor}
    >
      <TableHeader>
        <Column allowsSorting id="name" isRowHeader>
          Name
        </Column>
        <Column allowsSorting id="type">
          Type
        </Column>
        <Column allowsSorting id="numKeys">
          Keys
        </Column>
        <Column id="actions">
          <span className="sr-only">Actions</span>
        </Column>
      </TableHeader>
      <TableBody items={keychains}>
        {(keychain) => (
          <Row id={keychain.id}>
            <Cell>
              <span className="body-md-em">{keychain.name}</span>
            </Cell>
            <Cell>{keychain.type}</Cell>
            <Cell>{keychain.numKeys}</Cell>
            <Cell>
              <div className="flex justify-end">
                <ButtonLink
                  hierarchy="neutral"
                  href={{ params: { id: keychain.id }, to: "/keychains/$id" }}
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

function EmptyState({ hasAppliedFilters }: { hasAppliedFilters: boolean }) {
  if (hasAppliedFilters) {
    return (
      <Empty
        description="Try with different filters."
        icon={<MagnifyingGlassIcon />}
        title="No results found for your search"
      />
    );
  }

  return (
    <Empty
      description="Create your first one"
      icon={<SelectionPlusIcon />}
      title="You don't have any Keychains yet"
    />
  );
}
