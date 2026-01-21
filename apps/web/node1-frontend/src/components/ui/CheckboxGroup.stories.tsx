import type { Meta, StoryObj } from "@storybook/react-vite";

import { Form } from "react-aria-components";

import { Button } from "@/components/ui//Button";
import { Checkbox } from "@/components/ui//Checkbox";
import { CheckboxGroup } from "@/components/ui//CheckboxGroup";

const meta: Meta<typeof CheckboxGroup> = {
  args: {
    children: (
      <>
        <Checkbox value="sf">San Francisco</Checkbox>
        <Checkbox value="ny">New York</Checkbox>
        <Checkbox value="sydney">Sydney</Checkbox>
        <Checkbox value="london">London</Checkbox>
        <Checkbox value="tokyo">Tokyo</Checkbox>
      </>
    ),
    description: "",
    isDisabled: false,
    isRequired: false,
    label: "Cities",
  },
  argTypes: {},
  component: CheckboxGroup,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const Validation: Story = {
  render: (args) => (
    <Form className="flex flex-col gap-2 items-start">
      <CheckboxGroup {...args} />
      <Button type="submit" variant="secondary">
        Submit
      </Button>
    </Form>
  ),
  args: {
    isRequired: true,
  },
};
