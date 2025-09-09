import { render, screen, fireEvent } from "@testing-library/react";
import { ErrorBoundary } from "./ErrorBoundary";
import React from "react";
import { describe, expect, it } from "vitest";

// Helper component to throw error
function Bomb() {
  throw new Error("Test error");
  // Return null to satisfy React component type
  return null;
}

describe("ErrorBoundary", () => {
  it("renders children when no error", () => {
    render(
      <ErrorBoundary>
        <div>Safe content</div>
      </ErrorBoundary>
    );
    expect(screen.getByText("Safe content")).toBeInTheDocument();
  });

  it("shows fallback UI on error", () => {
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>
    );
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /try again/i })
    ).toBeInTheDocument();
  });

  it("resets error state when Try Again is clicked", () => {
    function ErrorThenOk({ trigger }: { trigger: boolean }) {
      if (trigger) throw new Error("Oops");
      return <div>All good</div>;
    }
    function Wrapper() {
      const [trigger, setTrigger] = React.useState(true);
      return (
        <ErrorBoundary>
          {trigger ? <ErrorThenOk trigger={trigger} /> : <div>All good</div>}
          <button onClick={() => setTrigger(false)}>Reset</button>
        </ErrorBoundary>
      );
    }
    render(<Wrapper />);
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    fireEvent.click(screen.getByText("Reset"));
    expect(screen.getByText("All good")).toBeInTheDocument();
  });
});
