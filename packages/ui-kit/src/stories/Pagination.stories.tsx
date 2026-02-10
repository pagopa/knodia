import type { Meta, StoryObj } from "@storybook/react-vite";

import { Pagination } from "../components/ui/Pagination";

const meta: Meta<typeof Pagination> = {
  title: "Components/ui/Pagination",
  component: Pagination,
  parameters: {
    layout: "centered",
  },
  args: {
    limit: 10,
    offset: 0,
    totalItems: 100,
  },
};

export default meta;
type Story = StoryObj<typeof Pagination>;

export const Default: Story = {};

export const MiddlePage: Story = {
  args: {
    offset: 50,
  },
};

export const LastPage: Story = {
  args: {
    offset: 100,
  },
};
