import { getAttribute } from "@knodia/attribute-models";
import { Button } from "@knodia/ui-kit/ui";
import { DialogTrigger } from "react-aria-components";
import { describe, expect, it } from "vitest";

import { renderWithProviders, screen } from "@/test/utils";

import { AttributeDescriptionModal } from "./AttributeDescriptionModal";

const nuts3 = getAttribute({ code: "nuts3", scheme: "vc_territorial_units" });

if (!nuts3) {
  throw new Error("Test fixture attribute not found");
}

describe("AttributeDescriptionModal", () => {
  it("renders the title and the card for the given attribute when open", () => {
    renderWithProviders(
      <DialogTrigger defaultOpen>
        <Button>Open</Button>
        <AttributeDescriptionModal
          description={nuts3.description}
          name={nuts3.name}
        />
      </DialogTrigger>,
    );

    expect(screen.getByText("Attribute description")).toBeInTheDocument();
    expect(screen.getByText("NUTS 3")).toBeInTheDocument();
    expect(
      screen.getByText(
        /third-level \(most granular\) administrative divisions/,
      ),
    ).toBeInTheDocument();
  });

  it("does not render the modal until the trigger is opened", () => {
    renderWithProviders(
      <DialogTrigger>
        <Button>Open</Button>
        <AttributeDescriptionModal
          description={nuts3.description}
          name={nuts3.name}
        />
      </DialogTrigger>,
    );

    expect(screen.queryByText("Attribute description")).not.toBeInTheDocument();
  });

  it("renders the description in an info banner for the info variant", () => {
    renderWithProviders(
      <DialogTrigger defaultOpen>
        <Button>Open</Button>
        <AttributeDescriptionModal
          description="Org-unique attribute explanation."
          name="Vega 001 Org"
          variant="info"
        />
      </DialogTrigger>,
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "Org-unique attribute explanation.",
    );
    // The info variant shows only the banner copy, not the definition-card name.
    expect(screen.queryByText("Vega 001 Org")).not.toBeInTheDocument();
  });
});
