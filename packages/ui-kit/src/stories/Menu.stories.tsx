import type { Meta, StoryObj } from "@storybook/react-vite";

import { DotsThreeIcon } from "@phosphor-icons/react";

import { ButtonIcon } from "../components/ui";
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
      <ButtonIcon>
        <DotsThreeIcon />
      </ButtonIcon>
      <Menu>
        <MenuItem>Profile</MenuItem>
        <MenuItem>Switch organization</MenuItem>
        <MenuItem>Logout</MenuItem>
      </Menu>
    </MenuTrigger>
  ),
};
