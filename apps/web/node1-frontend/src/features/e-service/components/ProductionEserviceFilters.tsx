import {
  Button,
  Menu,
  MenuItem,
  MenuTrigger,
  Select,
  SelectItem,
  TextField,
} from "@knodia/ui-kit/ui";
import { MagnifyingGlassIcon, SortAscendingIcon } from "@phosphor-icons/react";
import { useForm } from "@tanstack/react-form";

import { type ProductionEserviceSearchParams } from "../models/search-params";

const statusOptions = [
  { id: "all", label: "All Statuses" },
  { id: "active", label: "Active" },
  { id: "inactive", label: "Inactive" },
] as const;

const dataModeOptions = [
  { id: "all", label: "All Data Modes" },
  { id: "provide", label: "Provide" },
  { id: "consume", label: "Consume" },
] as const;

const orderByOptions = [
  { id: "name", label: "Name" },
  { id: "agreementsCount", label: "Nº of agreements" },
  { id: "purposesCount", label: "Nº of purposes" },
] as const;

type ProductionEserviceFiltersValues = Omit<
  ProductionEserviceSearchParams,
  "offset"
>;

export function ProductionEserviceFilters({
  defaultValues,
  onDebouncedChange,
}: {
  defaultValues: ProductionEserviceFiltersValues;
  onDebouncedChange?: (values: ProductionEserviceFiltersValues) => void;
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
      <div className="grid flex-1 min-w-0 grid-cols-4 gap-2">
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
              placeholder="Search E-Services..."
              value={field.state.value}
            />
          )}
          name="q"
        />

        <form.Field
          children={(field) => (
            <Select
              id={field.name}
              label="Status"
              name={field.name}
              onBlur={field.handleBlur}
              onChange={(key) =>
                field.handleChange(
                  statusOptions.find((o) => o.id === key)?.id ?? "all",
                )
              }
              value={field.state.value}
            >
              {statusOptions.map((option) => (
                <SelectItem id={option.id} key={option.id}>
                  {option.label}
                </SelectItem>
              ))}
            </Select>
          )}
          name="status"
        />

        <form.Field
          children={(field) => (
            <Select
              id={field.name}
              label="Data Mode"
              name={field.name}
              onBlur={field.handleBlur}
              onChange={(key) =>
                field.handleChange(
                  dataModeOptions.find((o) => o.id === key)?.id ?? "all",
                )
              }
              value={field.state.value}
            >
              {dataModeOptions.map((option) => (
                <SelectItem id={option.id} key={option.id}>
                  {option.label}
                </SelectItem>
              ))}
            </Select>
          )}
          name="dataMode"
        />
      </div>
      <div className="shrink-0">
        <form.Field
          children={(field) => (
            <MenuTrigger>
              <Button
                className="mt-auto"
                hierarchy="neutral"
                kind="ghost"
                size="lg"
              >
                <SortAscendingIcon />
                {orderByOptions.find((o) => o.id === field.state.value)?.label}
              </Button>

              <Menu
                onAction={(key) =>
                  field.handleChange(
                    (key as (typeof orderByOptions)[number]["id"]) ?? "name",
                  )
                }
                onClose={field.handleBlur}
                selectedKeys={[field.state.value]}
                selectionMode="single"
              >
                {orderByOptions.map((o) => (
                  <MenuItem id={o.id} key={o.id}>
                    {o.label}
                  </MenuItem>
                ))}
              </Menu>
            </MenuTrigger>
          )}
          name="orderBy"
        />
      </div>
    </form>
  );
}
