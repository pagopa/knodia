import type { ControlProps } from "@jsonforms/core";

import { withJsonFormsControlProps } from "@jsonforms/react";

function TextareaRendererComponent({
  data,
  enabled,
  errors,
  handleChange,
  label,
  path,
  schema,
  uischema,
  visible,
}: ControlProps) {
  if (!visible) return null;

  const maxLength =
    typeof schema.maxLength === "number" ? schema.maxLength : undefined;
  const value = typeof data === "string" ? data : "";
  const errorMessages =
    (uischema.options?.["errorMessages"] as Record<string, string>) ?? {};
  const displayError = errors
    ? (errorMessages["required"] ?? errorMessages["maxLength"] ?? errors)
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
      <textarea
        disabled={!enabled}
        maxLength={maxLength}
        onChange={(e) => handleChange(path, e.target.value)}
        style={{
          border: "1px solid lightgray",
          borderRadius: "4px",
          boxSizing: "border-box",
          minHeight: "6em",
          padding: "0.5em",
          resize: "vertical",
          width: "100%",
        }}
        value={value}
      />
      {maxLength != null && (
        <div style={{ color: "#666", fontSize: "0.75em", textAlign: "right" }}>
          {value.length}/{maxLength}
        </div>
      )}
    </div>
  );
}

export const TextareaRenderer = withJsonFormsControlProps(
  TextareaRendererComponent,
);
