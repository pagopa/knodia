import { Button } from "@knodia/ui-kit/ui";
import { DialogTrigger } from "react-aria-components";
import { describe, expect, it } from "vitest";

import { renderWithProviders, screen, waitFor } from "@/test/utils";

import { CategoriesListModal } from "./CategoriesListModal";

describe("CategoriesListModal", () => {
  it("renders the title and one card per catalog category when open", () => {
    renderWithProviders(
      <DialogTrigger defaultOpen>
        <Button>Open</Button>
        <CategoriesListModal />
      </DialogTrigger>,
    );

    expect(screen.getByText("Categories list")).toBeInTheDocument();
    expect(screen.getByText("Birth date")).toBeInTheDocument();
    expect(
      screen.getByText("That process the birth date for citizens."),
    ).toBeInTheDocument();
    // one definition card per catalog category
    expect(screen.getAllByText(/^That process the/)).toHaveLength(13);
  });

  it("does not render the modal until the trigger is opened", () => {
    renderWithProviders(
      <DialogTrigger>
        <Button>Open</Button>
        <CategoriesListModal />
      </DialogTrigger>,
    );

    expect(screen.queryByText("Categories list")).not.toBeInTheDocument();
  });

  it("closes when the user presses Escape", async () => {
    const { user } = renderWithProviders(
      <DialogTrigger defaultOpen>
        <Button>Open</Button>
        <CategoriesListModal />
      </DialogTrigger>,
    );

    await user.keyboard("{Escape}");

    await waitFor(() =>
      expect(screen.queryByText("Categories list")).not.toBeInTheDocument(),
    );
  });
});
