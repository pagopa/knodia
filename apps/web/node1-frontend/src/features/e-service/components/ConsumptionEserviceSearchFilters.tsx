import { Button, Select, SelectItem, TextField } from "@knodia/ui-kit/ui";
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
}: {
  onSubmit: (values: ConsumptionEserviceSearchParams) => void;
}) {
  const form = useForm({
    defaultValues: {
      category: "",
      keywords: "",
      knode: "",
      offset: 0,
    },
    onSubmit: ({ value }) => {
      onSubmit?.(value);
    },
  });

  return (
    <form
      className="flex items-end gap-24 mb-6"
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      <div className="grid flex-1 min-w-0 grid-cols-4 gap-2">
        {/* TODO: Make Knode select searchable */}
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

        {/* TODO: Make Category select searchable */}
        <form.Field
          children={(field) => (
            <Select
              id={field.name}
              label="Category"
              name={field.name}
              onBlur={field.handleBlur}
              onChange={(key) => field.handleChange((key as string) ?? "")}
              placeholder="Select a Category"
              value={field.state.value}
            >
              {categoryOptions.map((option) => (
                <SelectItem id={option.id} key={option.id}>
                  {option.label}
                </SelectItem>
              ))}
            </Select>
          )}
          name="category"
        />

        <form.Field
          children={(field) => (
            <TextField
              className="col-span-2"
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
