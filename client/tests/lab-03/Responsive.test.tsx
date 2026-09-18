import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { StaffTicketQueue } from "../../src/pages/StaffTicketQueue";
import { UserManagement } from "../../src/pages/UserManagement";
import * as api from "../../src/api";

const mockAdminUser: api.AuthUser = {
  id: "admin-1",
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
      user: mockAdminUser,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      changePassword: vi.fn(),
    }),
  };
});

describe("Responsive Component Tests (RESP-01, AC-18)", () => {
  const mockTicketsResponse: api.TicketListResponse = {
    data: [
      {
        id: "tkt-resp-001",
        ticketNumber: "TKT-2026-000001",
        summary: "Responsive test ticket summary",
        description: "Testing responsive card rendering on mobile viewports",
        categoryId: "cat-hw",
        categoryName: "Hardware",
        relatedSystemId: "sys-01",
        relatedSystemName: "Laptop",
        requestedPriority: "HIGH",
        itPriority: "HIGH",
        currentStatus: "NEW",
        createdAt: "2026-09-15T10:00:00.000Z",
        updatedAt: "2026-09-15T10:00:00.000Z",
        attachmentCount: 0,
        requester: { id: "req-1", name: "Jennifer Anderson", email: "jennifer@example.com" },
        owner: null,
      },
    ],
    pagination: {
      page: 1,
      limit: 10,
      totalItems: 1,
      totalPages: 1,
    },
  };

  const mockUsersResponse: api.AdminUserListResponse = {
    data: [
      {
        id: "user-resp-001",
        name: "Responsive Test User",
        email: "resp.user@example.com",
        role: "IT_STAFF",
        isActive: true,
        mustChangePassword: false,
        createdAt: "2026-09-15T10:00:00.000Z",
        updatedAt: "2026-09-15T10:00:00.000Z",
      },
    ],
    pagination: {
      page: 1,
      limit: 50,
      totalItems: 1,
      totalPages: 1,
    },
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders IT Staff Ticket Queue with both desktop table and mobile card containers for AC-18 responsiveness", async () => {
    vi.spyOn(api, "fetchTickets").mockResolvedValue(mockTicketsResponse);
    vi.spyOn(api, "fetchCategories").mockResolvedValue([{ id: "cat-hw", name: "Hardware" }]);

    render(<StaffTicketQueue currentUserRole="IT_STAFF" currentUserId="staff-1" onSelectTicket={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId("queue-row-tkt-resp-001")).toBeInTheDocument();
      expect(screen.getByTestId("queue-card-tkt-resp-001")).toBeInTheDocument();
    });

    // Check that desktop container has d-none d-lg-block and mobile container has d-lg-none
    const desktopRow = screen.getByTestId("queue-row-tkt-resp-001");
    const mobileCard = screen.getByTestId("queue-card-tkt-resp-001");

    expect(desktopRow.closest(".d-none.d-lg-block")).toBeInTheDocument();
    expect(mobileCard.closest(".d-lg-none")).toBeInTheDocument();
  });

  it("renders User Management with both desktop table and mobile card containers for AC-18 responsiveness", async () => {
    vi.spyOn(api, "fetchAdminUsers").mockResolvedValue(mockUsersResponse.data);

    render(<UserManagement currentAdminId="admin-1" />);

    await waitFor(() => {
      expect(screen.getByTestId("user-row-user-resp-001")).toBeInTheDocument();
      expect(screen.getByTestId("user-card-user-resp-001")).toBeInTheDocument();
    });

    const desktopRow = screen.getByTestId("user-row-user-resp-001");
    const mobileCard = screen.getByTestId("user-card-user-resp-001");

    expect(desktopRow.closest(".d-none.d-md-block")).toBeInTheDocument();
    expect(mobileCard.closest(".d-md-none")).toBeInTheDocument();
  });
});
