import type { Meta, StoryObj } from "@storybook/react-vite";

import { Form } from "react-aria-components";

import { Button } from "@/components/ui/Button";
import { Select, SelectItem, SelectSection } from "@/components/ui/Select";

const meta: Meta<typeof Select> = {
  component: Select,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    label: "Ice cream flavor",
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Example: Story = {
  render: (args) => (
    <Select {...args}>
      <SelectItem>Chocolate</SelectItem>
      <SelectItem id="mint">Mint</SelectItem>
      <SelectItem>Strawberry</SelectItem>
      <SelectItem>Vanilla</SelectItem>
    </Select>
  ),
};

export const DisabledItems: Story = {
  render: Example.render ?? (() => <></>),
  args: {
    ...Example.args,
    disabledKeys: ["mint"],
  },
};

export const Sections: Story = {
  render: (args) => {
    const options = [
      {
        name: "Fruit",
        children: [
          { name: "Apple" },
          { name: "Banana" },
          { name: "Orange" },
          { name: "Honeydew" },
          { name: "Grapes" },
          { name: "Watermelon" },
          { name: "Cantaloupe" },
          { name: "Pear" },
        ],
      },
      {
        name: "Vegetable",
        children: [
          { name: "Cabbage" },
          { name: "Broccoli" },
          { name: "Carrots" },
          { name: "Lettuce" },
          { name: "Spinach" },
          { name: "Bok Choy" },
          { name: "Cauliflower" },
          { name: "Potatoes" },
        ],
      },
    ];

    return (
      <Select {...args}>
        {options.map((section) => (
          <SelectSection
            items={section.children}
            key={section.name}
            title={section.name}
          >
            {section.children.map((item) => (
              <SelectItem id={item.name} key={item.name}>
                {item.name}
              </SelectItem>
            ))}
          </SelectSection>
        ))}
      </Select>
    );
  },
  args: {
    label: "Preferred fruit or vegetable",
  },
};

export const Validation: Story = {
  render: (args) => (
    <Form className="flex flex-col gap-2 items-start">
      <Select {...args}>
        <SelectItem>Chocolate</SelectItem>
        <SelectItem id="mint">Mint</SelectItem>
        <SelectItem>Strawberry</SelectItem>
        <SelectItem>Vanilla</SelectItem>
      </Select>
      <Button type="submit" variant="secondary">
        Submit
      </Button>
    </Form>
  ),
  args: {
    isRequired: true,
  },
};
