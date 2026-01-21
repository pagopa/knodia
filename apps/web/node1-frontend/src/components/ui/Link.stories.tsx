import { Meta, StoryObj } from "@storybook/react-vite";

import { Link } from "@/components/ui/Link";

const meta: Meta<typeof Link> = {
  component: Link,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Example: Story = {
  render: (args) => <Link {...args}>The missing link</Link>,
  args: {
    href: "https://www.imdb.com/title/tt6348138/",
    target: "_blank",
  },
};
