import { Checkbox, Select, SelectItem, TextField } from "@knodia/ui-kit/ui";
import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import { useForm } from "@tanstack/react-form";

import { type KeychainSearchParams } from "../models/search-params";

type KeychainFiltersValues = Omit<
  KeychainSearchParams,
  "offset" | "sortBy" | "sortDirection"
>;

const typeOptions = [
  { id: "all", label: "All types" },
  { id: "consumer", label: "Consumer" },
  { id: "producer", label: "Producer" },
  { id: "api", label: "API" },
] as const;

export function KeychainFilters({
  defaultValues,
  onDebouncedChange,
}: {
  defaultValues: KeychainFiltersValues;
  onDebouncedChange?: (values: KeychainFiltersValues) => void;
}) {
  const form = useForm({
    defaultValues,
    listeners: {
      onChange: (form) => {
        onDebouncedChange?.(form.formApi.state.values);
      },
      onChangeDebounceMs: 350,
    },
    onSubmit: ({ value }) => {
      onDebouncedChange?.(value);
    },
  });

  return (
    <form
      className="flex items-end gap-4 mb-6"
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      <div className="grid flex-1 min-w-0 grid-cols-4 gap-4">
        <form.Field
          children={(field) => (
            <TextField
              className="col-span-2"
              endIcon={<MagnifyingGlassIcon />}
              id={field.name}
              label="Search"
              name={field.name}
              onBlur={field.handleBlur}
              onChange={(value) => field.handleChange(value)}
              placeholder="Search Keychains..."
              size="lg"
              value={field.state.value}
            />
          )}
          name="q"
        />

        <form.Field
          children={(field) => (
            <Select
              className="col-span-1"
              id={field.name}
              label="Type"
              name={field.name}
              onBlur={field.handleBlur}
              onChange={(key) =>
                field.handleChange(
                  typeOptions.find((o) => o.id === key)?.id ?? "all",
                )
              }
              size="lg"
              value={field.state.value}
            >
              {typeOptions.map((option) => (
                <SelectItem id={option.id} key={option.id}>
                  {option.label}
                </SelectItem>
              ))}
            </Select>
          )}
          name="type"
        />
      </div>
      <div className="shrink-0">
        <form.Field
          children={(field) => (
            <Checkbox
              className="col-span-1"
              id={field.name}
              name={field.name}
              onBlur={field.handleBlur}
              onChange={(value) => field.handleChange(value)}
            >
              Show only my Keychains
            </Checkbox>
          )}
          name="showOnlyMyKeychains"
        />
      </div>
    </form>
  );
}
