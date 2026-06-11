import { describe, expect, it, vi } from "vitest";

import type {
  ControlElement,
  JsonSchema,
} from "@/features/purpose/engine/types";

import { renderWithProviders, screen } from "@/test/utils";

import { FieldRenderer } from "./FieldRenderer";

const control: ControlElement = {
  options: { widget: "text" },
  scope: "#/properties/myField",
  type: "Control",
};

const jsonSchema: JsonSchema = {
  properties: { myField: { type: "string" } },
  type: "object",
};

const texts = { "myField.label": "My Field" };

function renderField({ isReadOnly }: { isReadOnly: boolean }) {
  return renderWithProviders(
    <FieldRenderer
      allValues={{ myField: "hello" }}
      control={control}
      isReadOnly={isReadOnly}
      jsonSchema={jsonSchema}
      onChange={vi.fn()}
      texts={texts}
      value="hello"
    />,
  );
}

describe("FieldRenderer — Declared by Producer tooltip", () => {
  it("does not render the tooltip icon when isReadOnly is false", () => {
    renderField({ isReadOnly: false });

    expect(
      screen.queryByLabelText("Declared by Producer"),
    ).not.toBeInTheDocument();
  });

  it("renders the tooltip icon when isReadOnly is true", () => {
    renderField({ isReadOnly: true });

    expect(screen.getByLabelText("Declared by Producer")).toBeInTheDocument();
  });

  it("shows the tooltip text on focus", async () => {
    renderField({ isReadOnly: true });

    screen.getByLabelText("Declared by Producer").focus();

    expect(await screen.findByRole("tooltip")).toHaveTextContent(
      "Declared by Producer",
    );
  });
});
