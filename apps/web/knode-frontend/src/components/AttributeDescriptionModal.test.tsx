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
        <AttributeDescriptionModal attribute={nuts3} />
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
        <AttributeDescriptionModal attribute={nuts3} />
      </DialogTrigger>,
    );

    expect(screen.queryByText("Attribute description")).not.toBeInTheDocument();
  });
});
