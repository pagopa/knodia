import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  Cell,
  Column,
  Row,
  Table,
  TableBody,
  TableHeader,
} from "../components/ui/Table";

const meta: Meta<typeof Table> = {
  title: "Components/ui/Table",
  component: Table,
  parameters: {
    layout: "padded",
  },
};

export default meta;
type Story = StoryObj<typeof Table>;

const items = [
  { id: "1", name: "API Registry", consumer: "Acme Corp", status: "Active" },
  {
    id: "2",
    name: "Birth Certificate",
    consumer: "Beta Inc",
    status: "Pending",
  },
  {
    id: "3",
    name: "Tax Service",
    consumer: "Gamma Ltd",
    status: "Suspended",
  },
];

export const Default: Story = {
  render: () => (
    <Table aria-label="Example table">
      <TableHeader>
        <Column isRowHeader>Name</Column>
        <Column>Consumer</Column>
        <Column>Status</Column>
      </TableHeader>
      <TableBody items={items}>
        {(item) => (
          <Row id={item.id}>
            <Cell className="body-md">{item.name}</Cell>
            <Cell>{item.consumer}</Cell>
            <Cell>{item.status}</Cell>
          </Row>
        )}
      </TableBody>
    </Table>
  ),
};

export const Empty: Story = {
  render: () => (
    <Table aria-label="Empty table">
      <TableHeader>
        <Column isRowHeader>Name</Column>
        <Column>Consumer</Column>
        <Column>Status</Column>
      </TableHeader>
      <TableBody
        items={[]}
        renderEmptyState={() => (
          <p className="py-6 text-center text-primary-light-low-contrast">
            No items found
          </p>
        )}
      >
        {() => (
          <Row>
            <Cell />
            <Cell />
            <Cell />
          </Row>
        )}
      </TableBody>
    </Table>
  ),
};
