import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import App from "./App";

function renderApp() {
  return render(
    <MemoryRouter>
      <App />
    </MemoryRouter>,
  );
}

describe("CareBridge Phase 0 shell", () => {
  it("identifies the product as a caregiver benefits navigator", () => {
    renderApp();

    expect(screen.getByRole("heading", { name: /CareBridge/i })).toBeInTheDocument();
    expect(screen.getByText(/benefits and support navigator/i)).toBeInTheDocument();
    expect(screen.getByText(/caregivers after stroke discharge/i)).toBeInTheDocument();
  });

  it("shows responsible AI boundaries without product flow behavior", () => {
    renderApp();

    expect(screen.getByText(/does not determine final eligibility/i)).toBeInTheDocument();
    expect(screen.getByText(/does not provide medical advice/i)).toBeInTheDocument();
    expect(screen.getByText(/Phase 0 setup/i)).toBeInTheDocument();
  });
});
