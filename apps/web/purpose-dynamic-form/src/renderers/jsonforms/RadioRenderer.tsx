import type { ControlProps, OwnPropsOfEnum } from "@jsonforms/core";

import { withJsonFormsEnumProps } from "@jsonforms/react";

type Props = ControlProps & OwnPropsOfEnum;

function RadioRendererComponent({
  data,
  enabled,
  errors,
  handleChange,
  label,
  options,
  path,
  uischema,
  visible,
}: Props) {
  if (!visible) return null;

  const optionLabels =
    (uischema.options?.["optionLabels"] as Record<string, string>) ?? {};
  const errorMessages =
    (uischema.options?.["errorMessages"] as Record<string, string>) ?? {};
  const layout = uischema.options?.["layout"] as string | undefined;
  const displayError = errors
    ? (errorMessages["required"] ?? errors)
    : undefined;

  return (
    <div className="control">
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
      <div
        style={{
          display: "flex",
          flexDirection: layout === "horizontal" ? "row" : "column",
          gap: layout === "horizontal" ? "1.5em" : "0.25em",
        }}
      >
        {(options ?? []).map((opt) => (
          <label
            key={opt.value}
            style={{
              alignItems: "flex-start",
              cursor: enabled ? "pointer" : "default",
              display: "flex",
              gap: "0.5em",
            }}
          >
            <input
              checked={data === opt.value}
              disabled={!enabled}
              name={path}
              onChange={() => handleChange(path, opt.value)}
              style={{ marginTop: "0.25em" }}
              type="radio"
            />
            <span>{optionLabels[opt.value as string] ?? opt.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

export const RadioRenderer = withJsonFormsEnumProps(RadioRendererComponent);
