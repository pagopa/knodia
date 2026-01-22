import type { Meta, StoryObj } from "@storybook/react-vite";

import { Form } from "react-aria-components";

import { Button } from "../components/ui/Button";
import { TextField } from "../components/ui/TextField";

const meta: Meta<typeof TextField> = {
  component: TextField,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    label: "Name",
    placeholder: "Enter your full name",
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Example: Story = {
  render: (args) => <TextField {...args} />,
};

export const Validation: Story = {
  render: (args) => (
    <Form className="flex flex-col gap-2 items-start">
      <TextField {...args} />
      <Button type="submit" variant="secondary">
        Submit
      </Button>
    </Form>
  ),
};

Validation.args = {
  isRequired: true,
};
