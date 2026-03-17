import type {
  ControlProps,
  DispatchPropsOfMultiEnumControl,
  OwnPropsOfEnum,
} from "@jsonforms/core";

import { withJsonFormsMultiEnumProps } from "@jsonforms/react";

type Props = ControlProps & DispatchPropsOfMultiEnumControl & OwnPropsOfEnum;

function EnumArrayRendererComponent({
  addItem,
  data,
  enabled,
  errors,
  label,
  path,
  removeItem,
  schema,
  uischema,
  visible,
}: Props) {
  if (!visible) return null;

  const items = schema.items;
  const options: string[] =
    items && !Array.isArray(items) && "enum" in items
      ? (items.enum as string[])
      : [];
  const optionLabels =
    (uischema.options?.["optionLabels"] as Record<string, string>) ?? {};
  const errorMessages =
    (uischema.options?.["errorMessages"] as Record<string, string>) ?? {};
  const selected: string[] = Array.isArray(data) ? data : [];
  const displayError = errors
    ? (errorMessages["required"] ?? errors)
    : undefined;

  const handleToggle = (value: string) => {
    if (selected.includes(value)) {
      removeItem?.(path, value);
    } else {
      addItem(path, value);
    }
  };

  return (
    <div className="control" style={{ marginBottom: "0.5em" }}>
      {label && (
        <label
          style={{
            display: "block",
            fontWeight: "bold",
            marginBottom: "0.25em",
          }}
        >
          {label}
        </label>
      )}
      {displayError && (
        <div style={{ color: "red", fontSize: "0.85em" }}>{displayError}</div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.25em" }}>
        {options.map((value: string) => (
          <label
            key={value}
            style={{
              alignItems: "flex-start",
              cursor: enabled ? "pointer" : "default",
              display: "flex",
              gap: "0.5em",
            }}
          >
            <input
              checked={selected.includes(value)}
              disabled={!enabled}
              onChange={() => handleToggle(value)}
              style={{ marginTop: "0.25em" }}
              type="checkbox"
            />
            <span>{optionLabels[value] ?? value}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

export const EnumArrayRenderer = withJsonFormsMultiEnumProps(
  EnumArrayRendererComponent,
);
