import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DynamicIsland } from "./dynamic-island";

jest.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

jest.mock("lenis/react", () => ({
  useLenis: () => undefined,
}));

describe("DynamicIsland", () => {
  it("always offers a Sign in link to /sign-in", () => {
    render(<DynamicIsland />);
    const signIn = screen.getByRole("link", { name: /sign in/i });
    expect(signIn).toHaveAttribute("href", "/sign-in");
  });

  it("morphs into a menu with section links on small screens", async () => {
    const user = userEvent.setup();
    render(<DynamicIsland />);

    await user.click(screen.getByRole("button", { name: /open menu/i }));

    expect(screen.getByTestId("dynamic-island")).toHaveAttribute("data-mode", "menu");
    for (const label of ["How it works", "Detection", "Infrastructure", "Use cases"]) {
      expect(screen.getByRole("link", { name: new RegExp(label, "i") })).toHaveAttribute(
        "href",
        expect.stringContaining("#"),
      );
    }
    expect(screen.getByRole("link", { name: /open dashboard/i })).toHaveAttribute(
      "href",
      "/dashboard",
    );
  });
});
