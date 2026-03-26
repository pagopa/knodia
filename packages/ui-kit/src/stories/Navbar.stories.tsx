import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  Navbar,
  NavbarBrand,
  NavbarUserMenu,
} from "../components/layout/Navbar";
import { MenuItem } from "../components/ui/Menu";

const meta: Meta<typeof Navbar> = {
  title: "Components/layout/Navbar",
  component: Navbar,
  parameters: {},
};

export default meta;
type Story = StoryObj<typeof Navbar>;

export const Default: Story = {
  render: (args) => (
    <Navbar {...args}>
      <NavbarBrand>Application Name</NavbarBrand>
      <NavbarUserMenu
        avatar={{ fallback: "NS" }}
        name="User Name"
        role="User Role"
      >
        <MenuItem>Logout</MenuItem>
      </NavbarUserMenu>
    </Navbar>
  ),
};
