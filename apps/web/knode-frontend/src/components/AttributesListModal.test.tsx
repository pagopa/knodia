import { Button } from "@knodia/ui-kit/ui";
import { DialogTrigger } from "react-aria-components";
import { describe, expect, it } from "vitest";

import { renderWithProviders, screen, waitFor } from "@/test/utils";

import { AttributesListModal } from "./AttributesListModal";

describe("AttributesListModal", () => {
  it("renders the title, section labels, every catalog attribute and the info banner when open", () => {
    renderWithProviders(
      <DialogTrigger defaultOpen>
        <Button>Open</Button>
        <AttributesListModal />
      </DialogTrigger>,
    );

    expect(screen.getByText("Attributes list")).toBeInTheDocument();
    expect(screen.getByText("Main attributes")).toBeInTheDocument();
    expect(screen.getByText("Orgs personal attributes")).toBeInTheDocument();

    expect(screen.getByText("Testing Organization")).toBeInTheDocument();
    expect(screen.getByText("NUTS 3")).toBeInTheDocument();
    // one definition card per catalog attribute
    expect(screen.getAllByText(/^Organizations/)).toHaveLength(7);

    expect(
      screen.getByText(/each Organization has a unique identifying attribute/),
    ).toBeInTheDocument();
  });

  it("does not render the modal until the trigger is opened", () => {
    renderWithProviders(
      <DialogTrigger>
        <Button>Open</Button>
        <AttributesListModal />
      </DialogTrigger>,
    );

    expect(screen.queryByText("Attributes list")).not.toBeInTheDocument();
  });

  it("closes when the user presses Escape", async () => {
    const { user } = renderWithProviders(
      <DialogTrigger defaultOpen>
        <Button>Open</Button>
        <AttributesListModal />
      </DialogTrigger>,
    );

    await user.keyboard("{Escape}");

    await waitFor(() =>
      expect(screen.queryByText("Attributes list")).not.toBeInTheDocument(),
    );
  });
});
