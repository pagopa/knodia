import type { ControlProps, OwnPropsOfEnum } from "@jsonforms/core";

import { withJsonFormsEnumProps } from "@jsonforms/react";

type Props = ControlProps & OwnPropsOfEnum;

function SwitchRendererComponent({
  data,
  enabled,
  errors,
  handleChange,
  label,
  path,
  uischema,
  visible,
}: Props) {
  if (!visible) return null;

  const isChecked = data === "true";
  const optionLabels =
    (uischema.options?.["optionLabels"] as Record<string, string>) ?? {};
  const errorMessages =
    (uischema.options?.["errorMessages"] as Record<string, string>) ?? {};
  const switchLabel = optionLabels["true"] ?? label ?? "";
  const description = uischema.options?.["description"] as string | undefined;
  const infoLabel = uischema.options?.["infoLabel"] as string | undefined;
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
      {infoLabel && (
        <div
          style={{ color: "#666", fontSize: "0.85em", marginBottom: "0.25em" }}
        >
          {infoLabel}
        </div>
      )}
      {displayError && (
        <div style={{ color: "red", fontSize: "0.85em" }}>{displayError}</div>
      )}
      <label
        style={{
          alignItems: "flex-start",
          cursor: enabled ? "pointer" : "default",
          display: "flex",
          gap: "0.5em",
        }}
      >
        <input
          checked={isChecked}
          disabled={!enabled}
          onChange={() => handleChange(path, isChecked ? "false" : "true")}
          style={{ marginTop: "0.25em" }}
          type="checkbox"
        />
        <span>{switchLabel}</span>
      </label>
      {description && (
        <div
          style={{
            color: "#666",
            fontSize: "0.85em",
            marginLeft: "1.5em",
            marginTop: "0.25em",
          }}
        >
          {description}
        </div>
      )}
    </div>
  );
}

export const SwitchRenderer = withJsonFormsEnumProps(SwitchRendererComponent);
