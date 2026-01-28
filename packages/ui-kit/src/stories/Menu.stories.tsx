import type { Meta, StoryObj } from "@storybook/react-vite";

import { Ellipsis } from "lucide-react";

import {} from "../components/layout";
import { Button } from "../components/ui";
import { Menu } from "../components/ui/Menu";
import { MenuItem, MenuTrigger } from "../components/ui/Menu";

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
      <Button aria-label="Actions">
        <Ellipsis size={18} />
      </Button>
      <Menu>
        <MenuItem>Profile</MenuItem>
        <MenuItem>Switch organization</MenuItem>
        <MenuItem>Logout</MenuItem>
      </Menu>
    </MenuTrigger>
  ),
};
