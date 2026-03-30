import type { Meta, StoryObj } from "@storybook/react-vite";

import { Banner } from "../components/ui/Banner";

const meta: Meta<typeof Banner> = {
  title: "Components/ui/Banner",
  component: Banner,
  argTypes: {
    kind: {
      control: { type: "select" },
      options: ["informative", "success", "warning", "error", "neutral"],
    },
    size: {
      control: { type: "select" },
      options: ["sm", "md"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Banner>;

const kinds = [
  "informative",
  "success",
  "warning",
  "error",
  "neutral",
] as const;

export const Default: Story = {
  render: (args) => <Banner {...args}>Description</Banner>,
};

export const SmallWithAction: Story = {
  render: (args) => (
    <Banner {...args} action={{ label: "Action" }}>
      Description
    </Banner>
  ),
};

export const SmallWithDismiss: Story = {
  render: (args) => (
    <Banner {...args} onDismiss={console.log}>
      Description
    </Banner>
  ),
};

export const SmallWithBothActions: Story = {
  render: (args) => (
    <Banner
      {...args}
      action={{ label: "Action" }}
      onDismiss={console.log}
      prominentAction={{ label: "Action" }}
    >
      Description
    </Banner>
  ),
};

export const MediumDefault: Story = {
  render: (args) => (
    <Banner {...args} size="md" title="Title">
      Description
    </Banner>
  ),
};

export const MediumWithAction: Story = {
  render: (args) => (
    <Banner
      {...args}
      action={{ label: "Action" }}
      onDismiss={console.log}
      size="md"
      title="Title"
    >
      Description
    </Banner>
  ),
};

export const WithDisabledActions: Story = {
  render: (args) => (
    <Banner
      {...args}
      action={{ isDisabled: true, label: "Action" }}
      prominentAction={{ isDisabled: true, label: "Prominent Action" }}
    >
      Banner with disabled actions
    </Banner>
  ),
};

export const StickerSheet: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <p className="title-md-em">Small</p>
        {kinds.map((kind) => (
          <Banner
            action={{ label: "Action" }}
            key={kind}
            kind={kind}
            onDismiss={console.log}
          >
            Description
          </Banner>
        ))}
      </div>
      <div className="flex flex-col gap-4">
        <p className="title-md-em">Medium</p>
        {kinds.map((kind) => (
          <Banner
            action={{ label: "Action" }}
            key={kind}
            kind={kind}
            onDismiss={console.log}
            size="md"
            title="Title"
          >
            Description
          </Banner>
        ))}
      </div>
    </div>
  ),
};
