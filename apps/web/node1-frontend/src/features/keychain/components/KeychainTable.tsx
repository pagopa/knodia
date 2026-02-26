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
import { SelectionPlusIcon } from "@phosphor-icons/react";

export function KeychainTable({
  isLoading,
  keychains,
}: {
  isLoading: boolean;
  keychains: {
    id: string;
    name: string;
    numKeys: number;
    type: string;
  }[];
}) {
  if (isLoading) {
    return <Loader className="mx-auto mt-20" label="Loading..." />;
  }

  if (keychains.length === 0) {
    return (
      <Empty
        description="Create your first one"
        icon={<SelectionPlusIcon />}
        title="You don't have any Keychains yet"
      />
    );
  }

  return (
    <Table aria-label="Keychains table">
      <TableHeader>
        <Column allowsSorting id="1">
          Name
        </Column>
        <Column id="2">Type</Column>
        <Column id="3">Keys</Column>
        <Column id="4">
          <span className="sr-only">Actions</span>
        </Column>
      </TableHeader>
      <TableBody items={keychains}>
        {(item) => (
          <Row id={item.id}>
            <Cell>
              <span className="body-md-em">{item.name}</span>
            </Cell>
            <Cell>{item.type}</Cell>
            <Cell>{item.numKeys}</Cell>
            <Cell></Cell>
          </Row>
        )}
      </TableBody>
    </Table>
  );
}
