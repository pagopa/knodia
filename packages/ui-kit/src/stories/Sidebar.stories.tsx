import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  SidebarHeader,
  SidebarNavItem,
  SidebarSection,
} from "../components/layout";
import { Sidebar } from "../components/layout/Sidebar";

const meta: Meta<typeof Sidebar> = {
  title: "Components/layout/Sidebar",
  component: Sidebar,
  parameters: {},
};

export default meta;
type Story = StoryObj<typeof Sidebar>;

export const Default: Story = {
  render: (args) => (
    <Sidebar {...args}>
      <SidebarHeader>Application Name</SidebarHeader>
      <SidebarSection>
        <SidebarNavItem href="#" isCurrent>
          Route
        </SidebarNavItem>
      </SidebarSection>
      <SidebarSection title="Section Title 1">
        <SidebarNavItem href="#">Route 1</SidebarNavItem>
        <SidebarNavItem href="#">Route 2</SidebarNavItem>
        <SidebarNavItem href="#">Route 3</SidebarNavItem>
        <SidebarNavItem href="#">Route 4</SidebarNavItem>
      </SidebarSection>
      <SidebarSection title="Section Title 2">
        <SidebarNavItem href="#">Route 1</SidebarNavItem>
        <SidebarNavItem href="#">Route 2</SidebarNavItem>
        <SidebarNavItem href="#">Route 3</SidebarNavItem>
        <SidebarNavItem href="#">Route 4</SidebarNavItem>
      </SidebarSection>
    </Sidebar>
  ),
};
