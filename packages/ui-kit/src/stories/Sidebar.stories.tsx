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
        <SidebarNavItem isCurrent>
          <a href="#">Route</a>
        </SidebarNavItem>
      </SidebarSection>
      <SidebarSection title="Section Title 1">
        <SidebarNavItem>
          <a href="#">Route 1</a>
        </SidebarNavItem>
        <SidebarNavItem>
          <a href="#">Route 2</a>
        </SidebarNavItem>
        <SidebarNavItem>
          <a href="#">Route 3</a>
        </SidebarNavItem>
        <SidebarNavItem>
          <a href="#">Route 4</a>
        </SidebarNavItem>
      </SidebarSection>
      <SidebarSection title="Section Title 2">
        <SidebarNavItem>
          <a href="#">Route 1</a>
        </SidebarNavItem>
        <SidebarNavItem>
          <a href="#">Route 2</a>
        </SidebarNavItem>
        <SidebarNavItem>
          <a href="#">Route 3</a>
        </SidebarNavItem>
        <SidebarNavItem>
          <a href="#">Route 4</a>
        </SidebarNavItem>
      </SidebarSection>
    </Sidebar>
  ),
};
