import type { Meta, StoryObj } from "@storybook/react-vite";

import { ListItem } from "../components/ui";
import { Dropdown } from "../components/ui/Dropdown";
import { MockIcon } from "./utils";

const meta: Meta<typeof Dropdown> = {
  title: "Components/ui/Dropdown",
  component: Dropdown,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof Dropdown>;

export const Default: Story = {
  render: (args) => (
    <Dropdown {...args} className="w-80" selectionMode="single">
      {Array.from({ length: 6 }).map((_, index) => (
        <ListItem endIcon={<MockIcon />} key={index} startIcon={<MockIcon />}>
          Item {index + 1}
        </ListItem>
      ))}
    </Dropdown>
  ),
};
