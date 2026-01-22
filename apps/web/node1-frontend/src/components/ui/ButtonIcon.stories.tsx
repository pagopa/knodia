import type { Meta, StoryObj } from "@storybook/react-vite";

import { ButtonIcon, type ButtonIconProps } from "./ButtonIcon";

const hierarchies: NonNullable<ButtonIconProps["hierarchy"]>[] = [
  "neutral",
  "brand",
  "danger",
];
const kinds: NonNullable<ButtonIconProps["kind"]>[] = [
  "filled",
  "outlined",
  "ghost",
  "tonal",
  "elevated",
];
const sizes: NonNullable<ButtonIconProps["size"]>[] = ["sm", "md", "lg"];
const states = ["default", "disabled"] as const;

const meta: Meta<typeof ButtonIcon> = {
  title: "Components/ButtonIcon",
  component: ButtonIcon,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof ButtonIcon>;

export const StickerSheet: Story = {
  render: () => (
    <div className="flex flex-col gap-12 p-8">
      {kinds.map((kind) =>
        hierarchies.map((hierarchy) => (
          <div
            className="flex flex-col gap-6 border-b border-gray-100 pb-10"
            key={`${hierarchy}-${kind}`}
          >
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
              {kind} / {hierarchy}
            </h3>

            <div className="grid grid-cols-3 gap-x-12 gap-y-8 items-center justify-items-start">
              {states.map((state) =>
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
              )}
            </div>
          </div>
        )),
      )}
    </div>
  ),
};

function MockIcon() {
  return (
    <svg
      fill="none"
      height="20px"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="20px"
    >
      <rect height="18" rx="2" ry="2" width="18" x="3" y="3"></rect>
      <line x1="3" x2="21" y1="21" y2="3"></line>
    </svg>
  );
}
