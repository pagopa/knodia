import { getAttribute } from "@knodia/attribute-models";
import { describe, expect, it } from "vitest";

import { renderWithProviders, screen } from "@/test/utils";

import { AttributeDescriptionModal } from "./AttributeDescriptionModal";

const nuts3 =
  getAttribute({ code: "nuts3", scheme: "vc_territorial_units" }) ?? null;

describe("AttributeDescriptionModal", () => {
  it("renders the title and the card for the given attribute", () => {
    renderWithProviders(
      <AttributeDescriptionModal
        attribute={nuts3}
        isOpen
        onOpenChange={() => undefined}
      />,
    );

    expect(screen.getByText("Attribute description")).toBeInTheDocument();
    expect(screen.getByText("NUTS 3")).toBeInTheDocument();
    expect(
      screen.getByText(
        /third-level \(most granular\) administrative divisions/,
      ),
    ).toBeInTheDocument();
  });

  it("renders no card when no attribute is selected", () => {
    renderWithProviders(
      <AttributeDescriptionModal
        attribute={null}
        isOpen
        onOpenChange={() => undefined}
      />,
    );

    expect(screen.getByText("Attribute description")).toBeInTheDocument();
    expect(screen.queryByText(/^Organizations/)).not.toBeInTheDocument();
  });

  it("does not render when isOpen is false", () => {
    renderWithProviders(
      <AttributeDescriptionModal
        attribute={nuts3}
        isOpen={false}
        onOpenChange={() => undefined}
      />,
    );

    expect(screen.queryByText("Attribute description")).not.toBeInTheDocument();
  });
});
