import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import App from "./App";

function renderApp(initialPath = "/") {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <App />
    </MemoryRouter>,
  );
}

describe("CareBridge Phase 1 product flow", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders product navigation and the support plan home screen", () => {
    renderApp();

    expect(screen.getByRole("link", { name: /^Home$/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^Intake$/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^Benefits$/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^Plan$/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^Profile$/i })).toBeInTheDocument();
    expect(screen.getByText(/benefits and support navigator/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Your Support Navigation Plan/i })).toBeInTheDocument();
    expect(screen.getByText(/Transportation Assistance/i)).toBeInTheDocument();
  });

  it("loads the demo persona and carries it into profile and benefits", () => {
    renderApp();

    fireEvent.click(screen.getByRole("button", { name: /Load Demo Persona/i }));
    fireEvent.click(screen.getByRole("link", { name: /^Profile$/i }));

    expect(screen.getByText(/John/i)).toBeInTheDocument();
    expect(screen.getByText(/Montgomery County, OH/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("link", { name: /^Benefits$/i }));
    expect(screen.getByText(/Possible Match/i)).toBeInTheDocument();
    expect(screen.getByText(/Still missing/i)).toBeInTheDocument();
  });

  it("shows one intake question at a time with a not sure option", () => {
    renderApp("/intake");

    expect(screen.getByRole("heading", { name: /Discharge context/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Not sure/i })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Transportation/i })).not.toBeInTheDocument();
  });

  it("keeps responsible AI visible and avoids certainty language", () => {
    renderApp("/benefits");

    expect(screen.getByText(/does not determine final eligibility/i)).toBeInTheDocument();
    expect(screen.getByText(/does not provide medical advice/i)).toBeInTheDocument();

    const pageText = document.body.textContent ?? "";
    expect(pageText).not.toMatch(/\byou qualify\b/i);
    expect(pageText).not.toMatch(/\beligible\b/i);
    expect(pageText).not.toMatch(/\bapproved\b/i);
    expect(pageText).not.toMatch(/\bguaranteed\b/i);
  });
});
