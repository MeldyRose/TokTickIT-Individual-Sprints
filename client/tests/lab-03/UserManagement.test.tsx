import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { UserManagement } from "../../src/pages/UserManagement";
import * as api from "../../src/api";
import { AuthProvider } from "../../src/context/AuthContext";

// Mock Auth Context logged-in user as Administrator
const mockAdminContextUser: api.AuthUser = {
  id: "admin-user-001",
  name: "Admin User",
  email: "admin@toktickit.com",
  role: "ADMINISTRATOR",
  mustChangePassword: false,
};

vi.mock("../../src/context/AuthContext", async () => {
  const actual = await vi.importActual("../../src/context/AuthContext");
  return {
    ...actual,
    useAuth: () => ({
      user: mockAdminContextUser,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      changePassword: vi.fn(),
    }),
  };
});

describe("Administrator User Management UI Component Tests (UI-05, AC-12..15)", () => {
  const mockUsersList: api.AdminUser[] = [
    {
      id: "u-admin-1",
      name: "Admin User",
      email: "admin@toktickit.com",
      role: "ADMINISTRATOR",
      isActive: true,
      mustChangePassword: false,
      createdAt: "2026-09-01T00:00:00.000Z",
    },
    {
      id: "u-staff-1",
      name: "Alex Thompson",
      email: "alex.thompson@toktickit.com",
      role: "IT_STAFF",
      isActive: true,
      mustChangePassword: false,
      createdAt: "2026-09-02T00:00:00.000Z",
    },
    {
      id: "u-req-1",
      name: "Jennifer Anderson",
      email: "jennifer.a@example.com",
      role: "REQUESTER",
      isActive: true,
      mustChangePassword: true,
      createdAt: "2026-09-03T00:00:00.000Z",
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(api, "fetchAdminUsers").mockResolvedValue(mockUsersList);
  });

  it("renders User Management screen header, controls, and user table (UI-05, AC-12)", async () => {
    render(<UserManagement />);

    expect(await screen.findByTestId("user-management-page")).toBeInTheDocument();
    expect(screen.getByTestId("create-user-btn")).toBeInTheDocument();
    expect(screen.getByTestId("search-input")).toBeInTheDocument();
    expect(screen.getByTestId("role-filter-select")).toBeInTheDocument();
    expect(screen.getByTestId("user-table")).toBeInTheDocument();

    expect(screen.getAllByText("Admin User").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Alex Thompson").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Jennifer Anderson").length).toBeGreaterThan(0);
  });

  it("filters user list when role selection changes (AC-12)", async () => {
    const fetchSpy = vi.spyOn(api, "fetchAdminUsers").mockResolvedValue([mockUsersList[1]]);

    render(<UserManagement />);

    const roleSelect = await screen.findByTestId("role-filter-select");
    fireEvent.change(roleSelect, { target: { value: "IT_STAFF" } });

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith({ search: undefined, role: "IT_STAFF" });
    });
  });

  it("opens Create User modal, submits valid form, and displays success toast (AC-13)", async () => {
    const createSpy = vi.spyOn(api, "createAdminUser").mockResolvedValue({
      user: {
        id: "u-new-1",
        name: "New Test User",
        email: "newuser@toktickit.com",
        role: "IT_STAFF",
        isActive: true,
        mustChangePassword: true,
        createdAt: "2026-09-18T00:00:00.000Z",
      },
    });

    render(<UserManagement />);

    const createBtn = await screen.findByTestId("create-user-btn");
    fireEvent.click(createBtn);

    expect(screen.getByTestId("create-user-modal")).toBeInTheDocument();

    fireEvent.change(screen.getByTestId("create-user-name-input"), { target: { value: "New Test User" } });
    fireEvent.change(screen.getByTestId("create-user-email-input"), { target: { value: "newuser@toktickit.com" } });
    fireEvent.change(screen.getByTestId("create-user-role-select"), { target: { value: "IT_STAFF" } });
    fireEvent.change(screen.getByTestId("create-user-password-input"), { target: { value: "InitialPassword123!" } });

    fireEvent.click(screen.getByTestId("submit-create-user-btn"));

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith({
        name: "New Test User",
        email: "newuser@toktickit.com",
        role: "IT_STAFF",
        isActive: true,
        initialPassword: "InitialPassword123!",
      });
    });

    expect(await screen.findByTestId("success-toast")).toHaveTextContent("User account created successfully");
  });

  it("displays error banner inside Create Modal on API error (e.g. duplicate email)", async () => {
    vi.spyOn(api, "createAdminUser").mockRejectedValue(new Error("A user account with this email address already exists."));

    render(<UserManagement />);

    const createBtn = await screen.findByTestId("create-user-btn");
    fireEvent.click(createBtn);

    fireEvent.change(screen.getByTestId("create-user-name-input"), { target: { value: "Duplicate User" } });
    fireEvent.change(screen.getByTestId("create-user-email-input"), { target: { value: "admin@toktickit.com" } });
    fireEvent.change(screen.getByTestId("create-user-password-input"), { target: { value: "InitialPassword123!" } });

    fireEvent.click(screen.getByTestId("submit-create-user-btn"));

    expect(await screen.findByTestId("create-user-error-banner")).toHaveTextContent("A user account with this email address already exists.");
  });

  it("opens Edit User modal, submits changes, and displays success toast (AC-14)", async () => {
    const updateSpy = vi.spyOn(api, "updateAdminUser").mockResolvedValue({
      user: {
        ...mockUsersList[1],
        name: "Alex Thompson Updated",
      },
    });

    render(<UserManagement />);

    const editBtn = await screen.findByTestId(`edit-user-btn-${mockUsersList[1].id}`);
    fireEvent.click(editBtn);

    expect(screen.getByTestId("edit-user-modal")).toBeInTheDocument();

    const nameInput = screen.getByTestId("edit-user-name-input");
    fireEvent.change(nameInput, { target: { value: "Alex Thompson Updated" } });

    fireEvent.click(screen.getByTestId("submit-edit-user-btn"));

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith(mockUsersList[1].id, {
        name: "Alex Thompson Updated",
        email: "alex.thompson@toktickit.com",
        role: "IT_STAFF",
        isActive: true,
      });
    });

    expect(await screen.findByTestId("success-toast")).toHaveTextContent("User account updated successfully");
  });

  it("opens Reset Password modal, submits new initial password, and displays success toast (AC-15)", async () => {
    const resetSpy = vi.spyOn(api, "resetUserInitialPassword").mockResolvedValue({
      message: "Initial password reset successfully",
      userId: mockUsersList[2].id,
      mustChangePassword: true,
    });

    render(<UserManagement />);

    const resetBtn = await screen.findByTestId(`reset-password-btn-${mockUsersList[2].id}`);
    fireEvent.click(resetBtn);

    expect(screen.getByTestId("reset-password-modal")).toBeInTheDocument();

    fireEvent.change(screen.getByTestId("reset-password-input"), { target: { value: "NewTempPassword123!" } });

    fireEvent.click(screen.getByTestId("submit-reset-password-btn"));

    await waitFor(() => {
      expect(resetSpy).toHaveBeenCalledWith(mockUsersList[2].id, "NewTempPassword123!");
    });

    expect(await screen.findByTestId("success-toast")).toHaveTextContent("Initial password reset successfully");
  });
});
