import type { Meta, StoryObj } from "@storybook/react-vite";

import { BookOpenTextIcon } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { DialogTrigger, type Key } from "react-aria-components";

import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import {
  MultiSelectComboBox,
  MultiSelectComboBoxItem,
} from "../components/ui/MultiSelectComboBox";

interface Option {
  id: string;
  label: string;
}

const OPTIONS: Option[] = [
  { id: "knodia:testing_organization", label: "Testing Organization" },
  { id: "vc_territorial_units:nuts1", label: "NUTS 1" },
  { id: "vc_territorial_units:nuts2", label: "NUTS 2" },
  { id: "vc_territorial_units:nuts3", label: "NUTS 3" },
  {
    id: "vc_poc_attributes:companies_registries",
    label: "Companies Registries",
  },
  { id: "vc_poc_attributes:training_institutes", label: "Training Institutes" },
];

const meta: Meta<typeof MultiSelectComboBox> = {
  title: "Components/ui/MultiSelectComboBox",
  component: MultiSelectComboBox,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof MultiSelectComboBox>;

function MultiSelectComboBoxExample({
  action,
  initialInputValue = "",
  initialValue = [],
  isDisabled,
  isReadOnly,
}: {
  action?: React.ReactNode;
  initialInputValue?: string;
  initialValue?: Key[];
  isDisabled?: boolean;
  isReadOnly?: boolean;
}) {
  const [inputValue, setInputValue] = useState(initialInputValue);
  const [value, setValue] = useState<Key[]>(initialValue);

  const items = useMemo(
    () =>
      OPTIONS.filter((o) =>
        o.label.toLowerCase().includes(inputValue.toLowerCase()),
      ),
    [inputValue],
  );
  const selectedOptions = value
    .map((key) => OPTIONS.find((item) => item.id === key))
    .filter((item) => item != null);

  const handleChange = (keys: Key[]) => {
    setValue(keys);
  };

  return (
    <>
      <MultiSelectComboBox
        action={action}
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
        selectedOptions={selectedOptions}
        value={value}
      >
        {(item) => (
          <MultiSelectComboBoxItem id={item.id}>
            {item.label}
          </MultiSelectComboBoxItem>
        )}
      </MultiSelectComboBox>
    </>
  );
}

export const Default: Story = {
  render: () => <MultiSelectComboBoxExample />,
};

// The action sits on the input's row and keeps its own behavior: AriaComboBox
// would otherwise hijack any descendant button as its dropdown trigger.
export const WithAction: Story = {
  render: () => (
    <MultiSelectComboBoxExample
      action={
        <DialogTrigger>
          <Button
            className="shrink-0"
            hierarchy="neutral"
            kind="ghost"
            size="lg"
          >
            <BookOpenTextIcon />
            Attributes list
          </Button>
          <Modal isDismissable title="Attributes list">
            <p>Attributes list modal content.</p>
          </Modal>
        </DialogTrigger>
      }
      initialValue={[
        "vc_territorial_units:nuts1",
        "vc_poc_attributes:companies_registries",
      ]}
    />
  ),
};

export const NoResults: Story = {
  render: () => <MultiSelectComboBoxExample initialInputValue="no match" />,
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
