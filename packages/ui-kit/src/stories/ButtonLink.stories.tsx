import type { Meta, StoryObj } from "@storybook/react-vite";

import { PlaceholderIcon } from "@phosphor-icons/react";

import { ButtonLink, type ButtonLinkProps } from "../components/ui/ButtonLink";
import { renderStickerSheet } from "./utils";

const sizes: NonNullable<ButtonLinkProps["size"]>[] = ["sm", "md", "lg"];
const iconSizes: NonNullable<ButtonLinkProps["size"]>[] = [
  "icon-sm",
  "icon-md",
  "icon-lg",
];
const states = ["default", "disabled"] as const;

const meta: Meta<typeof ButtonLink> = {
  title: "Components/ui/ButtonLink",
  component: ButtonLink,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof ButtonLink>;

export const Default: Story = {
  args: {
    children: "ButtonLink",
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
          <ButtonLink
            hierarchy={hierarchy}
            href="#"
            isDisabled={state === "disabled"}
            key={`${hierarchy}-${kind}-${state}-${size}`}
            kind={kind}
            size={size}
          >
            <PlaceholderIcon />
            ButtonLink
            <PlaceholderIcon />
          </ButtonLink>
        )),
      ),
  ),
};

export const WithIconStickerSheet: Story = {
  render: renderStickerSheet(
    [
      ["filled", "outlined", "ghost", "tonal", "elevated"],
      ["neutral", "brand", "danger"],
    ],
    (kind, hierarchy) =>
      states.map((state) =>
        iconSizes.map((size) => (
          <ButtonLink
            hierarchy={hierarchy}
            isDisabled={state === "disabled"}
            key={`${hierarchy}-${kind}-${state}-${size}`}
            kind={kind}
            size={size}
          >
            <PlaceholderIcon />
          </ButtonLink>
        )),
      ),
  ),
};
