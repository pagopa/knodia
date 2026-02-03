import type { Meta, StoryObj } from "@storybook/react-vite";

import { Checkbox } from "../components/ui/Checkbox";
import { CheckboxGroup } from "../components/ui/CheckboxGroup";
import { renderStickerSheet } from "./utils";

const meta: Meta<typeof CheckboxGroup> = {
  title: "Components/ui/CheckboxGroup",
  component: CheckboxGroup,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof CheckboxGroup>;

export const Default: Story = {
  render: (args) => (
    <CheckboxGroup {...args} description="Hint message" label="Label">
      <Checkbox description="Description" value="1">
        Checkbox Label
      </Checkbox>
      <Checkbox description="Description" value="2">
        Checkbox Label
      </Checkbox>
      <Checkbox description="Description" value="3">
        Checkbox Label
      </Checkbox>
    </CheckboxGroup>
  ),
};

export const StickerSheet: Story = {
  render: renderStickerSheet([["horizontal", "vertical"]], (orientation) => (
    <CheckboxGroup
      description="Hint message"
      label="Label"
      orientation={orientation}
    >
      <Checkbox description="Description" value="1">
        Checkbox Label
      </Checkbox>
      <Checkbox description="Description" value="2">
        Checkbox Label
      </Checkbox>
      <Checkbox description="Description" isDisabled value="3">
        Checkbox Label
      </Checkbox>
    </CheckboxGroup>
  )),
  parameters: {
    layout: "padded",
  },
};
