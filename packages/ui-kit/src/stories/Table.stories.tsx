import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  Cell,
  Column,
  Row,
  Table,
  TableBody,
  TableHeader,
} from "../components/ui/Table";

const rows = Array.from({ length: 6 }, (_, i) => ({
  id: `row-${i + 1}`,
  column1: "Text",
  column2: "Text",
  column3: "Text",
  column4: "Text",
}));

const meta: Meta<typeof Table> = {
  title: "Components/ui/Table",
  component: Table,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof Table>;

export const Default: Story = {
  render: (args) => (
    <div className="w-190">
      <Table
        {...args}
        aria-label="Table"
        onSortChange={() => void 0}
        sortDescriptor={{ column: "1", direction: "descending" }}
      >
        <TableHeader>
          <Column allowsSorting id="1">
            Header
          </Column>
          <Column id="2">Header</Column>
          <Column id="3">Header</Column>
          <Column id="4">Header</Column>
        </TableHeader>
        <TableBody items={rows}>
          {(item) => (
            <Row id={item.id}>
              <Cell>{item.column1}</Cell>
              <Cell>{item.column2}</Cell>
              <Cell>{item.column3}</Cell>
              <Cell>{item.column4}</Cell>
            </Row>
          )}
        </TableBody>
      </Table>
    </div>
  ),
};
