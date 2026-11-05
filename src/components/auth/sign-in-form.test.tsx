import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SignInForm } from "./sign-in-form";

const push = jest.fn();
const prefetch = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push, prefetch }),
}));

describe("SignInForm (demo)", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    push.mockClear();
  });
  afterEach(() => jest.useRealTimers());

  it("prefetches the dashboard", () => {
    render(<SignInForm />);
    expect(prefetch).toHaveBeenCalledWith("/dashboard");
  });

  it("goes to the dashboard after submitting — no credentials required", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<SignInForm />);

    await user.click(screen.getByRole("button", { name: /^sign in$/i }));
    expect(screen.getByText(/signing in/i)).toBeInTheDocument();

    act(() => jest.advanceTimersByTime(1000));
    expect(push).toHaveBeenCalledWith("/dashboard");
  });

  it("supports the World ID path", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<SignInForm />);

    await user.click(screen.getByRole("button", { name: /continue with world id/i }));
    act(() => jest.advanceTimersByTime(1500));
    expect(push).toHaveBeenCalledWith("/dashboard");
  });

  it("toggles password visibility", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<SignInForm />);
    const password = screen.getByLabelText("Password");
    expect(password).toHaveAttribute("type", "password");
    await user.click(screen.getByRole("button", { name: /show password/i }));
    expect(password).toHaveAttribute("type", "text");
  });
});
