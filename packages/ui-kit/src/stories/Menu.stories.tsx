import type { Meta, StoryObj } from "@storybook/react-vite";

import { DotsThreeIcon } from "@phosphor-icons/react";

import { Button } from "../components/ui";
import { Menu, MenuItem, MenuTrigger } from "../components/ui/Menu";

const meta: Meta<typeof Menu> = {
  title: "Components/ui/Menu",
  component: Menu,
  parameters: {},
};

export default meta;
type Story = StoryObj<typeof Menu>;

export const Default: Story = {
  render: () => (
    <MenuTrigger>
      <Button size="icon-md">
        <DotsThreeIcon />
      </Button>
      <Menu>
        <MenuItem>Profile</MenuItem>
        <MenuItem>Switch organization</MenuItem>
        <MenuItem>Logout</MenuItem>
      </Menu>
    </MenuTrigger>
  ),
};
