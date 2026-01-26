import type { Meta, StoryObj } from "@storybook/react-vite";

import { ButtonIcon, type ButtonIconProps } from "../components/ui/ButtonIcon";
import { MockIcon, renderStickerSheet } from "./utils";

const sizes: NonNullable<ButtonIconProps["size"]>[] = ["sm", "md", "lg"];
const states = ["default", "disabled"] as const;

const meta: Meta<typeof ButtonIcon> = {
  title: "Components/ui/ButtonIcon",
  component: ButtonIcon,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof ButtonIcon>;

export const Default: Story = {
  args: {
    children: <MockIcon />,
  },
};

export const StickerSheet: Story = {
  render: renderStickerSheet(
    [
      ["filled", "outlined", "ghost", "tonal", "elevated"],
      ["neutral", "brand", "danger"],
    ],
    (kind, hierarchy) =>
      states.map((state) =>
        sizes.map((size) => (
          <ButtonIcon
            hierarchy={hierarchy}
            isDisabled={state === "disabled"}
            key={`${hierarchy}-${kind}-${state}-${size}`}
            kind={kind}
            size={size}
          >
            <MockIcon />
          </ButtonIcon>
        )),
      ),
  ),
};
