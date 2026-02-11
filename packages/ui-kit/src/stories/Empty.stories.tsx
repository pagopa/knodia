import type { Meta, StoryObj } from "@storybook/react-vite";

import { PlaceholderIcon } from "@phosphor-icons/react";

import { Empty, type EmptyProps } from "../components/ui/Empty";
import { renderStickerSheet } from "./utils";

const kinds = [
  "neutral",
  "brand",
  "informative",
  "success",
  "warning",
  "error",
] as const satisfies EmptyProps["kind"][];

const meta: Meta<typeof Empty> = {
  title: "Components/ui/Empty",
  component: Empty,
  argTypes: {
    kind: {
      control: { type: "select" },
      options: kinds,
    },
  },
};

export default meta;
type Story = StoryObj<typeof Empty>;

export const Default: Story = {
  args: {
    title: "Title",
    description: "Description",
    kind: "neutral",
    action: {
      as: "button",
      label: "Action",
      icon: <PlaceholderIcon />,
      onClick: () => alert("Action clicked"),
    },
  },
};

export const StickerSheet: Story = {
  render: renderStickerSheet([kinds], (kind) => (
    <Empty
      action={{
        as: "button",
        label: "Action",
        icon: <PlaceholderIcon />,
        onClick: () => alert("Action clicked"),
      }}
      description="Description"
      key={kind}
      kind={kind}
      title="Title"
    />
  )),
};
