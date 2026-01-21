import type { Meta, StoryObj } from "@storybook/react-vite";

import { ListBox, ListBoxItem } from "@/components/ui/ListBox";

const meta: Meta<typeof ListBox> = {
  component: ListBox,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Example: Story = {
  render: (args) => (
    <ListBox aria-label="Ice cream flavor" {...args}>
      <ListBoxItem id="chocolate">Chocolate</ListBoxItem>
      <ListBoxItem id="mint">Mint</ListBoxItem>
      <ListBoxItem id="strawberry">Strawberry</ListBoxItem>
      <ListBoxItem id="vanilla">Vanilla</ListBoxItem>
    </ListBox>
  ),
  args: {
    onAction: () => null,
    selectionMode: "multiple",
  },
};

export const DisabledItems: Story = {
  render: Example.render ?? (() => <></>),
  args: {
    ...Example.args,
    disabledKeys: ["mint"],
  },
};
