import { categories } from "@knodia/category-models";
import { Button, ComboBox, ComboBoxItem, TextField } from "@knodia/ui-kit/ui";
import { useForm } from "@tanstack/react-form";

import type { ConsumptionEserviceSearchParams } from "../../models/search-params";

import { toSchemeRefOptions } from "../../utils/schemeRef";

// TODO: the current Knode is Orion, so the only other Knode is Lynx. In the future, the list and the
// check of available remote Knodes should be dynamic. If this code is reused for the Lynx node, this
// hardcoded list will need to be replaced.
const knodeOptions = [{ id: "Lynx", label: "Lynx" }];

const categoryOptions = toSchemeRefOptions(categories);

interface Props {
  defaultValues: Omit<ConsumptionEserviceSearchParams, "offset">;
  onSubmit: (values: Omit<ConsumptionEserviceSearchParams, "offset">) => void;
  onValidationError: () => void;
}

export function SearchFilters({
  defaultValues,
  onSubmit,
  onValidationError,
}: Props) {
  const form = useForm({
    defaultValues,
    onSubmit: ({ value }) => {
      // Knode is required AND (category OR keywords) is required
      if (!value.knodeId || (!value.category && !value.keywords)) {
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
            <ComboBox
              defaultItems={knodeOptions}
              id={field.name}
              label="Knode"
              name={field.name}
              onBlur={field.handleBlur}
              onSelectionChange={(key) =>
                field.handleChange((key as string) ?? "")
              }
              placeholder="Select a Knode"
              selectedKey={field.state.value || null}
            >
              {(option) => (
                <ComboBoxItem id={option.id}>{option.label}</ComboBoxItem>
              )}
            </ComboBox>
          )}
          name="knodeId"
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
