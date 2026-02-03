import type { Meta, StoryObj } from "@storybook/react-vite";

import { Radio, RadioGroup } from "../components/ui/RadioGroup";
import { renderStickerSheet } from "./utils";

const meta: Meta<typeof RadioGroup> = {
  title: "Components/ui/RadioGroup",
  component: RadioGroup,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof RadioGroup>;

export const Default: Story = {
  render: (args) => (
    <RadioGroup {...args} description="Hint message" label="Label">
      <Radio description="Description" value="1">
        Radio Label
      </Radio>
      <Radio description="Description" value="2">
        Radio Label
      </Radio>
      <Radio description="Description" value="3">
        Radio Label
      </Radio>
    </RadioGroup>
  ),
};

export const StickerSheet: Story = {
  render: renderStickerSheet([["horizontal", "vertical"]], (orientation) => (
    <RadioGroup
      description="Hint message"
      label="Label"
      orientation={orientation}
    >
      <Radio description="Description" value="1">
        Radio Label
      </Radio>
      <Radio description="Description" value="2">
        Radio Label
      </Radio>
      <Radio description="Description" isDisabled value="3">
        Radio Label
      </Radio>
    </RadioGroup>
  )),
  parameters: {
    layout: "padded",
  },
};
