import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import App from "../../src/App";
import * as api from "../../src/api";

describe("Mandatory Change Password Component Tests (UI-02, AC-02, FR-02, BR-02, BR-07)", () => {
  const mockMustChangeUser: api.AuthUser = {
    id: "u_req_1",
    name: "Jennifer Anderson",
    email: "jennifer@toktickit.com",
    role: "REQUESTER",
    mustChangePassword: true,
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders mandatory password change modal when mustChangePassword = true (UI-02, AC-02)", async () => {
    vi.spyOn(api, "getCurrentUser").mockResolvedValue(mockMustChangeUser);

    render(<App />);

    expect(await screen.findByTestId("change-password-modal")).toBeInTheDocument();
    expect(screen.getByTestId("current-password-input")).toBeInTheDocument();
    expect(screen.getByTestId("new-password-input")).toBeInTheDocument();
    expect(screen.getByTestId("confirm-password-input")).toBeInTheDocument();
    expect(screen.getByTestId("save-password-btn")).toBeInTheDocument();
    expect(screen.getByTestId("password-complexity-checklist")).toBeInTheDocument();
  });

  it("updates password complexity checklist indicators as user types (UI-02, BR-07)", async () => {
    vi.spyOn(api, "getCurrentUser").mockResolvedValue(mockMustChangeUser);

    render(<App />);

    const newPasswordInput = await screen.findByTestId("new-password-input");

    // Initially weak
    expect(screen.getByTestId("rule-min-length")).toBeInTheDocument();

    // Type weak password
    fireEvent.change(newPasswordInput, { target: { value: "short" } });
    expect(screen.getByTestId("rule-min-length")).toHaveClass("text-muted");

    // Type complex password
    fireEvent.change(newPasswordInput, { target: { value: "ComplexPass123!" } });
    expect(screen.getByTestId("rule-min-length")).toHaveClass("text-dark");
  });

  it("displays error banner when new passwords do not match (UI-02)", async () => {
    vi.spyOn(api, "getCurrentUser").mockResolvedValue(mockMustChangeUser);

    render(<App />);

    const currentInput = await screen.findByTestId("current-password-input");
    const newInput = screen.getByTestId("new-password-input");
    const confirmInput = screen.getByTestId("confirm-password-input");
    const saveBtn = screen.getByTestId("save-password-btn");

    fireEvent.change(currentInput, { target: { value: "Initial123!" } });
    fireEvent.change(newInput, { target: { value: "ComplexPass123!" } });
    fireEvent.change(confirmInput, { target: { value: "DifferentPass123!" } });

    fireEvent.click(saveBtn);

    const errorBanner = await screen.findByTestId("change-password-error-banner");
    expect(errorBanner).toHaveTextContent("New passwords do not match.");
  });

  it("submits password change API and clears modal on success (AC-02, BR-06)", async () => {
    vi.spyOn(api, "getCurrentUser").mockResolvedValue(mockMustChangeUser);
    const changePasswordSpy = vi.spyOn(api, "changePasswordUser").mockResolvedValue({
      message: "Password updated successfully",
      mustChangePassword: false,
    });
    vi.spyOn(api, "fetchMyTickets").mockResolvedValue({
      data: [],
      pagination: { page: 1, limit: 10, totalItems: 0, totalPages: 1 },
    });

    render(<App />);

    const currentInput = await screen.findByTestId("current-password-input");
    const newInput = screen.getByTestId("new-password-input");
    const confirmInput = screen.getByTestId("confirm-password-input");
    const saveBtn = screen.getByTestId("save-password-btn");

    fireEvent.change(currentInput, { target: { value: "Initial123!" } });
    fireEvent.change(newInput, { target: { value: "NewSecurePass123!" } });
    fireEvent.change(confirmInput, { target: { value: "NewSecurePass123!" } });

    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(changePasswordSpy).toHaveBeenCalledWith("Initial123!", "NewSecurePass123!", "NewSecurePass123!");
    });

    // Modal should close and main view should be accessible
    await waitFor(() => {
      expect(screen.queryByTestId("change-password-modal")).not.toBeInTheDocument();
    });
  });
});
