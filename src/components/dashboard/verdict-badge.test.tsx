import { render, screen } from "@testing-library/react";
import { VerdictBadge, verdictMeta } from "./verdict-badge";

describe("VerdictBadge", () => {
  it.each(["authentic", "tampered", "unregistered"] as const)(
    "labels the %s verdict with text, not colour alone",
    (verdict) => {
      render(<VerdictBadge verdict={verdict} />);
      expect(screen.getByText(verdictMeta[verdict].label)).toBeInTheDocument();
    },
  );
});
