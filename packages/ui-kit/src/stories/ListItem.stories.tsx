import type { Meta, StoryObj } from "@storybook/react-vite";

import { ListBox } from "react-aria-components";

import { ListItem } from "../components/ui/ListItem";
import { MockIcon, renderStickerSheet } from "./utils";

const meta: Meta<typeof ListItem> = {
  title: "Components/ui/ListItem",
  component: ListItem,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof ListItem>;

export const Default: Story = {
  render: (args) => (
    <ListBox
      aria-label="Test ListBox"
      className="w-80"
      selectionMode="multiple"
    >
      <ListItem endIcon={<MockIcon />} startIcon={<MockIcon />} {...args}>
        Label
      </ListItem>
    </ListBox>
  ),
};

export const StickerSheet: Story = {
  render: renderStickerSheet([], () => (
    <div className="flex flex-col gap-12">
      {(["normal", "selected", "disabled"] as const).map((state) => (
        <ListBox
          aria-label={`Test ListBox - ${state}`}
          className="w-80"
          key={state}
          selectedKeys={state === "selected" ? ["item"] : []}
          selectionMode="single"
        >
          <ListItem
            endIcon={<MockIcon />}
            id="item"
            isDisabled={state === "disabled"}
            startIcon={<MockIcon />}
          >
            Label
          </ListItem>
        </ListBox>
      ))}
    </div>
  )),
};
