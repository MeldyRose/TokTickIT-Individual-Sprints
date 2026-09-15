import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import App from "../../src/App";
import * as api from "../../src/api";

describe("Login Screen Component Tests (UI-01, AC-01, FR-01, BR-08)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders centered Zen Green login form when user is not authenticated (UI-01, AC-01)", async () => {
    vi.spyOn(api, "getCurrentUser").mockResolvedValue(null);

    render(<App />);

    expect(await screen.findByTestId("login-page")).toBeInTheDocument();
    expect(screen.getByTestId("login-email-input")).toBeInTheDocument();
    expect(screen.getByTestId("login-password-input")).toBeInTheDocument();
    expect(screen.getByTestId("login-submit-btn")).toBeInTheDocument();
    expect(screen.getByTestId("toggle-password-btn")).toBeInTheDocument();
  });

  it("displays inline field validation errors when submitting empty fields (UI-01)", async () => {
    vi.spyOn(api, "getCurrentUser").mockResolvedValue(null);

    render(<App />);

    const submitBtn = await screen.findByTestId("login-submit-btn");
    fireEvent.click(submitBtn);

    expect(await screen.findByTestId("email-error")).toHaveTextContent("Email address is required.");
    expect(screen.getByTestId("password-error")).toHaveTextContent("Password is required.");
  });

  it("toggles password input visibility when clicking toggle button (UI-01)", async () => {
    vi.spyOn(api, "getCurrentUser").mockResolvedValue(null);

    render(<App />);

    const passwordInput = (await screen.findByTestId("login-password-input")) as HTMLInputElement;
    const toggleBtn = screen.getByTestId("toggle-password-btn");

    expect(passwordInput.type).toBe("password");
    expect(toggleBtn).toHaveTextContent("Show");

    fireEvent.click(toggleBtn);

    expect(passwordInput.type).toBe("text");
    expect(toggleBtn).toHaveTextContent("Hide");

    fireEvent.click(toggleBtn);
    expect(passwordInput.type).toBe("password");
  });

  it("displays safe failure alert banner for invalid credentials (UI-01, AC-01, BR-08)", async () => {
    vi.spyOn(api, "getCurrentUser").mockResolvedValue(null);
    vi.spyOn(api, "loginUser").mockRejectedValue(
      new Error("Invalid email or password. Please try again.")
    );

    render(<App />);

    const emailInput = await screen.findByTestId("login-email-input");
    const passwordInput = screen.getByTestId("login-password-input");
    const submitBtn = screen.getByTestId("login-submit-btn");

    fireEvent.change(emailInput, { target: { value: "invalid@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "WrongPass123!" } });

    fireEvent.click(submitBtn);

    const errorBanner = await screen.findByTestId("login-error-banner");
    expect(errorBanner).toHaveTextContent("Invalid email or password. Please try again.");
  });

  it("handles successful login submission and transitions to authenticated view (AC-01)", async () => {
    const mockUser: api.AuthUser = {
      id: "u_staff_1",
      name: "Alex Thompson",
      email: "alex.thompson@toktickit.com",
      role: "IT_STAFF",
      mustChangePassword: false,
    };

    vi.spyOn(api, "getCurrentUser").mockResolvedValue(null);
    const loginSpy = vi.spyOn(api, "loginUser").mockResolvedValue(mockUser);
    vi.spyOn(api, "fetchMyTickets").mockResolvedValue({
      data: [],
      pagination: { page: 1, limit: 10, totalItems: 0, totalPages: 1 },
    });

    render(<App />);

    const emailInput = await screen.findByTestId("login-email-input");
    const passwordInput = screen.getByTestId("login-password-input");
    const submitBtn = screen.getByTestId("login-submit-btn");

    fireEvent.change(emailInput, { target: { value: "alex.thompson@toktickit.com" } });
    fireEvent.change(passwordInput, { target: { value: "Password123!" } });

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(loginSpy).toHaveBeenCalledWith("alex.thompson@toktickit.com", "Password123!");
    });

    expect(await screen.findByTestId("authenticated-user-widget")).toBeInTheDocument();
    expect(screen.getByTestId("user-name-display")).toHaveTextContent("Alex Thompson");
    expect(screen.getByTestId("user-role-badge")).toHaveTextContent("IT Staff");
  });
});
