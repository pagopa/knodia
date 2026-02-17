import {
  Button,
  ComboBox,
  ComboBoxItem,
  Select,
  SelectItem,
  TextField,
} from "@knodia/ui-kit/ui";
import { useForm } from "@tanstack/react-form";

import { type ConsumptionEserviceSearchParams } from "../models/search-params";

// TODO: Replace with real data
const knodeOptions = [
  { id: "knode-1", label: "Knode 1" },
  { id: "knode-2", label: "Knode 2" },
  { id: "knode-3", label: "Knode 3" },
];

const categoryOptions = [
  { id: "cat1", label: "Category 1" },
  { id: "cat2", label: "Category 2" },
  { id: "cat3", label: "Category 3" },
];

export function ConsumptionEserviceSearchFilters({
  onSubmit,
  onValidationError,
}: {
  onSubmit: (values: ConsumptionEserviceSearchParams) => void;
  onValidationError: () => void;
}) {
  const form = useForm({
    defaultValues: {
      category: "",
      keywords: "",
      knode: "",
      offset: 0,
    },
    onSubmit: ({ value }) => {
      // Knode is required AND (category OR keywords) is required
      if (!value.knode || (!value.category && !value.keywords)) {
        onValidationError();
        return;
      }

      onSubmit(value);
    },
  });

  return (
    <form
      className="flex items-end gap-12 mb-10"
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      <div className="grid flex-1 min-w-0 grid-cols-3 gap-2">
        <form.Field
          children={(field) => (
            <Select
              id={field.name}
              label="Knode"
              name={field.name}
              onBlur={field.handleBlur}
              onChange={(key) => field.handleChange((key as string) ?? "")}
              placeholder="Select a Knode"
              value={field.state.value}
            >
              {knodeOptions.map((option) => (
                <SelectItem id={option.id} key={option.id}>
                  {option.label}
                </SelectItem>
              ))}
            </Select>
          )}
          name="knode"
        />

        <form.Field
          children={(field) => (
            <ComboBox
              defaultItems={categoryOptions}
              id={field.name}
              isClearable
              label="Category"
              name={field.name}
              onBlur={field.handleBlur}
              onSelectionChange={(key) =>
                field.handleChange((key as string) ?? "")
              }
              placeholder="Select a Category"
              selectedKey={field.state.value || null}
            >
              {(option) => (
                <ComboBoxItem id={option.id}>{option.label}</ComboBoxItem>
              )}
            </ComboBox>
          )}
          name="category"
        />

        <form.Field
          children={(field) => (
            <TextField
              id={field.name}
              label="Keywords"
              name={field.name}
              onBlur={field.handleBlur}
              onChange={(value) => field.handleChange(value)}
              placeholder="Type keywords..."
              value={field.state.value}
            />
          )}
          name="keywords"
        />
      </div>

      <Button className="shrink-0" hierarchy="brand" size="lg" type="submit">
        Search
      </Button>
    </form>
  );
}
