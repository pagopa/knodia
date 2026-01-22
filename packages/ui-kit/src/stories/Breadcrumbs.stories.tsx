import type { Meta, StoryObj } from "@storybook/react-vite";

import { Breadcrumb, Breadcrumbs } from "../components/ui/Breadcrumbs";

const meta: Meta<typeof Breadcrumbs> = {
  title: "Components/Breadcrumbs",
  component: Breadcrumbs,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof Breadcrumbs>;

export const StickerSheet: Story = {
  render: () => (
    <Breadcrumbs>
      <Breadcrumb href="#">Root</Breadcrumb>
      <Breadcrumb href="#">Sub-level</Breadcrumb>
      <Breadcrumb href="#">Sub-level</Breadcrumb>
      <Breadcrumb href="#">Sub-level</Breadcrumb>
      <Breadcrumb>Current page</Breadcrumb>
    </Breadcrumbs>
  ),
};
