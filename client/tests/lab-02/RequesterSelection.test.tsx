import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import App from "../../src/App";
import * as api from "../../src/api";

describe("Development Requester Selection (Issue 3)", () => {
  const mockRequesters = [
    { id: "req-user-001", name: "Jennifer Anderson", email: "jennifer.a@example.com" },
    { id: "req-user-002", name: "Michael Brown", email: "michael.b@example.com" },
  ];

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("renders the selection screen when no requester is selected (AC-02, FR-05)", async () => {
    vi.spyOn(api, "fetchRequesters").mockResolvedValueOnce(mockRequesters);

    render(<App />);

    // Check loading indicator first or wait for selection title
    expect(await screen.findByTestId("selection-title")).toBeInTheDocument();
    expect(screen.getByText(/Select Development Requester/i)).toBeInTheDocument();
    expect(screen.getByText(/This is not a login screen/i)).toBeInTheDocument();
  });

  it("populates active requesters in dropdown and handles selection (AC-10, BR-04)", async () => {
    vi.spyOn(api, "fetchRequesters").mockResolvedValueOnce(mockRequesters);

    render(<App />);

    const selectElement = await screen.findByTestId("requester-select-dropdown");
    expect(selectElement).toBeInTheDocument();

    expect(screen.getByText("Jennifer Anderson (jennifer.a@example.com)")).toBeInTheDocument();
    expect(screen.getByText("Michael Brown (michael.b@example.com)")).toBeInTheDocument();

    // Select Jennifer Anderson from dropdown
    fireEvent.change(selectElement, { target: { value: "req-user-001" } });

    // Click Continue button
    const continueBtn = screen.getByTestId("continue-btn");
    fireEvent.click(continueBtn);

    // Verify active requester display in header
    expect(await screen.findByTestId("active-requester-display")).toHaveTextContent("Jennifer Anderson");
    expect(screen.getByTestId("change-requester-btn")).toBeInTheDocument();
  });

  it("clears requester when Change Requester button is clicked", async () => {
    localStorage.setItem(
      "toktickit_active_requester",
      JSON.stringify(mockRequesters[0])
    );
    vi.spyOn(api, "fetchRequesters").mockResolvedValueOnce(mockRequesters);

    render(<App />);

    // Initially logged in as Jennifer Anderson
    const activeDisplay = await screen.findByTestId("active-requester-display");
    expect(activeDisplay).toHaveTextContent("Jennifer Anderson");

    // Click Change Requester
    const changeBtn = screen.getByTestId("change-requester-btn");
    fireEvent.click(changeBtn);

    // Selection screen should be rendered again
    expect(await screen.findByTestId("selection-title")).toBeInTheDocument();
  });
});
