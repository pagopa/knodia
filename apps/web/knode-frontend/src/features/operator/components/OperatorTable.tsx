import type { bffApi } from "@knodia/bff-client";
import type { UserRole } from "@knodia/common-models/auth";

import {
  Cell,
  Column,
  Loader,
  Row,
  Table,
  TableBody,
  TableHeader,
} from "@knodia/ui-kit/ui";

interface OperatorTableProps {
  isLoading: boolean;
  operators: bffApi.Operators;
}

export function OperatorTable({ isLoading, operators }: OperatorTableProps) {
  if (isLoading) {
    return <Loader className="mx-auto mt-20" label="Loading..." />;
  }

  return (
    <Table aria-label="Keychains table">
      <TableHeader>
        <Column id="name" isRowHeader>
          Name
        </Column>
        <Column id="email">Email</Column>
        <Column id="role">Role</Column>
      </TableHeader>
      <TableBody items={operators}>
        {(operator) => (
          <Row id={operator.id}>
            <Cell className="body-md-em">{operator.username}</Cell>
            <Cell className="body-md-em">{operator.email}</Cell>
            <Cell className="body-md-em">{formatRoles(operator.roles)}</Cell>
          </Row>
        )}
      </TableBody>
    </Table>
  );
}

function formatRoles(roles: UserRole[]) {
  function capitalize(role: UserRole) {
    return role.charAt(0).toUpperCase() + role.slice(1);
  }

  return roles.map(capitalize).join(", ");
}
