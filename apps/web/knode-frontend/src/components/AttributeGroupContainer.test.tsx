import { describe, expect, it } from "vitest";

import { renderWithProviders, screen } from "@/test/utils";

import { AttributeGroupContainer } from "./AttributeGroupContainer";

describe("AttributeGroupContainer", () => {
  it("opens the description modal for a catalog attribute when the book icon is pressed", async () => {
    const { user } = renderWithProviders(
      <AttributeGroupContainer
        attributes={[{ code: "nuts1", scheme: "vc_territorial_units" }]}
      />,
    );

    expect(screen.queryByText("Attribute description")).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Show description for NUTS 1" }),
    );

    expect(screen.getByText("Attribute description")).toBeInTheDocument();
    expect(
      screen.getByText(/first-level \(largest\) administrative divisions/),
    ).toBeInTheDocument();
  });

  it("renders no documentation trigger for an attribute outside the catalog", () => {
    renderWithProviders(
      <AttributeGroupContainer
        attributes={[{ code: "org-123", scheme: "knode-Lynx" }]}
      />,
    );

    expect(screen.getByText("org-123")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
