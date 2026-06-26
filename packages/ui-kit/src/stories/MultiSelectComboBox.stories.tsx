import type { Meta, StoryObj } from "@storybook/react-vite";

import { useMemo, useState } from "react";
import { type Key } from "react-aria-components";

import {
  MultiSelectComboBox,
  MultiSelectComboBoxItem,
  type MultiSelectComboBoxTag,
} from "../components/ui/MultiSelectComboBox";

interface Option {
  id: string;
  name: string;
}

const OPTIONS: Option[] = [
  { id: "knodia:testing_organization", name: "Testing Organization" },
  { id: "vc_territorial_units:nuts1", name: "NUTS 1" },
  { id: "vc_territorial_units:nuts2", name: "NUTS 2" },
  { id: "vc_territorial_units:nuts3", name: "NUTS 3" },
  {
    id: "vc_poc_attributes:companies_registries",
    name: "Companies Registries",
  },
  { id: "vc_poc_attributes:training_institutes", name: "Training Institutes" },
];

const meta: Meta<typeof MultiSelectComboBox<Option>> = {
  title: "Components/ui/MultiSelectComboBox",
  component: MultiSelectComboBox,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof MultiSelectComboBox<Option>>;

function MultiSelectComboBoxExample({
  initialValue = [],
  isDisabled,
  isReadOnly,
}: {
  initialValue?: Key[];
  isDisabled?: boolean;
  isReadOnly?: boolean;
}) {
  const [inputValue, setInputValue] = useState("");
  const [value, setValue] = useState<Key[]>(initialValue);
  // Label cache populated at selection time, so chips survive filtering.
  const [labels, setLabels] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      initialValue.flatMap((key) => {
        const found = OPTIONS.find((o) => o.id === key);
        return found ? [[String(key), found.name]] : [];
      }),
    ),
  );

  const items = useMemo(
    () =>
      OPTIONS.filter((o) =>
        o.name.toLowerCase().includes(inputValue.toLowerCase()),
      ),
    [inputValue],
  );

  const handleChange = (keys: Key[]) => {
    setValue(keys);
    setLabels((prev) => {
      const next = { ...prev };
      for (const key of keys) {
        if (next[String(key)] === undefined) {
          const found = OPTIONS.find((o) => o.id === key);
          if (found) next[String(key)] = found.name;
        }
      }
      return next;
    });
  };

  const selectedTags: MultiSelectComboBoxTag[] = value.map((key) => ({
    key,
    label: labels[String(key)] ?? String(key),
  }));

  return (
    <MultiSelectComboBox<Option>
      aria-label="Attributes"
      className="w-80"
      inputValue={inputValue}
      isDisabled={isDisabled}
      isReadOnly={isReadOnly}
      items={items}
      label="Attributes"
      onChange={handleChange}
      onInputChange={setInputValue}
      placeholder="Type to search..."
      selectedTags={selectedTags}
      value={value}
    >
      {(item) => (
        <MultiSelectComboBoxItem id={item.id}>
          {item.name}
        </MultiSelectComboBoxItem>
      )}
    </MultiSelectComboBox>
  );
}

export const Default: Story = {
  render: () => <MultiSelectComboBoxExample />,
};

export const Disabled: Story = {
  render: () => (
    <MultiSelectComboBoxExample
      initialValue={[
        "vc_territorial_units:nuts1",
        "vc_territorial_units:nuts2",
      ]}
      isDisabled
    />
  ),
};

export const ReadOnly: Story = {
  render: () => (
    <MultiSelectComboBoxExample
      initialValue={[
        "vc_territorial_units:nuts1",
        "vc_territorial_units:nuts2",
      ]}
      isReadOnly
    />
  ),
};
