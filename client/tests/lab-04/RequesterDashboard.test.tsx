import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { RequesterDashboard } from "../../src/pages/RequesterDashboard";
import { Header } from "../../src/components/Header";
import App from "../../src/App";
import * as api from "../../src/api";
import * as AuthContextModule from "../../src/context/AuthContext";

describe("Requester Dashboard Component Tests (RequesterDashboard.test.tsx - Feature 30)", () => {
  const requesterUser: api.AuthUser = {
    id: "u_requester_1",
    name: "Jennifer Anderson",
    email: "jennifer.a@toktickit.com",
    role: "REQUESTER",
    mustChangePassword: false,
  };

  const mockDashboardData: api.RequesterDashboardResponse = {
    metrics: {
      totalOpen: 3,
      totalActive: 3,
      waitingForRequester: 1,
      waitingForMyInput: 1,
      recentlyUpdated: 4,
      recentlyResolved: 5,
      resolvedRecently: 5,
      inProgress: 1,
      closed: 2,
    },
    recentTickets: [
      {
        id: "tkt-001",
        ticketNumber: "TKT-2026-000001",
        summary: "VPN access connection failure",
        currentStatus: "WAITING_FOR_REQUESTER",
        actionRequired: true,
        updatedAt: "2026-10-31T02:00:00.000Z",
        createdAt: "2026-10-30T09:00:00.000Z",
      },
      {
        id: "tkt-002",
        ticketNumber: "TKT-2026-000002",
        summary: "Monitors flickering on workstation dock",
        currentStatus: "IN_PROGRESS",
        actionRequired: false,
        updatedAt: "2026-10-31T01:30:00.000Z",
        createdAt: "2026-10-30T10:00:00.000Z",
      },
      {
        id: "tkt-003",
        ticketNumber: "TKT-2026-000003",
        summary: "Request new software license",
        currentStatus: "RESOLVED",
        actionRequired: false,
        updatedAt: "2026-10-30T15:00:00.000Z",
        createdAt: "2026-10-29T14:00:00.000Z",
      },
    ],
    recentActivity: [],
    calculatedAt: "2026-10-31T02:05:00.000Z",
  };

  beforeEach(() => {
    window.history.pushState(null, "", "/");
    vi.restoreAllMocks();
    vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
      user: requesterUser,
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      changePassword: vi.fn(),
      refreshUser: vi.fn(),
    });

    vi.spyOn(api, "fetchRequesterDashboard").mockResolvedValue(mockDashboardData);
    vi.spyOn(api, "fetchCategories").mockResolvedValue([]);
    vi.spyOn(api, "fetchRelatedSystems").mockResolvedValue([]);
    vi.spyOn(api, "fetchMyTickets").mockImplementation((params) => {
      if (params?.status === "IN_PROGRESS") {
        return Promise.resolve({ data: [], pagination: { page: 1, limit: 1, totalItems: 1, totalPages: 1 } });
      }
      if (params?.status === "CLOSED") {
        return Promise.resolve({ data: [], pagination: { page: 1, limit: 1, totalItems: 2, totalPages: 1 } });
      }
      if (params?.resolvedRange === "7d") {
        return Promise.resolve({ data: [], pagination: { page: 1, limit: 1, totalItems: 5, totalPages: 1 } });
      }
      return Promise.resolve({ data: [], pagination: { page: 1, limit: 10, totalItems: 0, totalPages: 0 } });
    });
  });

  describe("1. Rendering & Dashboard Layout", () => {
    it("renders Requester Dashboard header with title, subtitle, refresh button, and create ticket button", async () => {
      render(<RequesterDashboard />);

      expect(await screen.findByTestId("requester-dashboard")).toBeInTheDocument();
      expect(screen.getByTestId("requester-dashboard-title")).toHaveTextContent("My IT Support Dashboard");
      expect(screen.getByText(/Track the progress of your IT support tickets/i)).toBeInTheDocument();
      expect(screen.getByTestId("dashboard-refresh-btn")).toBeInTheDocument();
      expect(screen.getByTestId("dashboard-create-ticket-btn")).toBeInTheDocument();
    });

    it("renders all high-impact metric cards with labels and values, including Resolved Recently", async () => {
      render(<RequesterDashboard />);

      expect(await screen.findByTestId("metric-cards-grid")).toBeInTheDocument();
      expect(screen.getByTestId("metric-card-open")).toBeInTheDocument();
      expect(screen.getByTestId("metric-card-in-progress")).toBeInTheDocument();
      expect(screen.getByTestId("metric-card-waiting-input")).toBeInTheDocument();
      expect(screen.getByTestId("metric-card-resolved")).toBeInTheDocument();
      expect(screen.getByTestId("metric-card-closed")).toBeInTheDocument();

      expect(screen.getByTestId("metric-card-open-value")).toHaveTextContent("3");
      expect(screen.getByTestId("metric-card-in-progress-value")).toHaveTextContent("1");
      expect(screen.getByTestId("metric-card-waiting-input-value")).toHaveTextContent("1");
      expect(screen.getByTestId("metric-card-resolved-value")).toHaveTextContent("5");
      expect(screen.getByTestId("metric-card-closed-value")).toHaveTextContent("2");

      expect(screen.getByText("Resolved Recently")).toBeInTheDocument();
      expect(screen.getByText("Tickets resolved in the last 7 days")).toBeInTheDocument();
    });
  });

  describe("2. Action Required Alert Banner", () => {
    it("renders the Action Required banner when tickets are waiting for requester feedback", async () => {
      render(<RequesterDashboard />);

      const banner = await screen.findByTestId("requester-action-required-banner");
      expect(banner).toBeInTheDocument();
      expect(banner).toHaveTextContent(/IT Staff is waiting for your response on 1 ticket/i);
      expect(screen.getByTestId("banner-view-waiting-tickets")).toBeInTheDocument();
      expect(screen.getByTestId("banner-review-ticket-btn")).toBeInTheDocument();
    });

    it("clicking 'Review Ticket #...' button navigates directly to ticket details (ui-spec 3.2.3)", async () => {
      const onSelectMock = vi.fn();
      render(<RequesterDashboard onSelectTicket={onSelectMock} />);

      const reviewBtn = await screen.findByTestId("banner-review-ticket-btn");
      expect(reviewBtn).toHaveTextContent("Review Ticket #TKT-2026-000001 →");
      fireEvent.click(reviewBtn);

      expect(onSelectMock).toHaveBeenCalledWith("tkt-001");
    });

    it("clicking 'View Waiting Tickets' triggers drill-down with WAITING_FOR_REQUESTER status", async () => {
      const onNavigateMock = vi.fn();
      render(<RequesterDashboard onNavigateToTickets={onNavigateMock} />);

      const viewBtn = await screen.findByTestId("banner-view-waiting-tickets");
      fireEvent.click(viewBtn);

      expect(onNavigateMock).toHaveBeenCalledWith("WAITING_FOR_REQUESTER", undefined);
    });

    it("hides the Action Required banner when waiting count is zero", async () => {
      vi.spyOn(api, "fetchRequesterDashboard").mockResolvedValueOnce({
        ...mockDashboardData,
        metrics: {
          ...mockDashboardData.metrics,
          waitingForRequester: 0,
          waitingForMyInput: 0,
        },
      });

      render(<RequesterDashboard />);

      await screen.findByTestId("requester-dashboard");
      expect(screen.queryByTestId("requester-action-required-banner")).not.toBeInTheDocument();
    });
  });

  describe("3. Metric Cards Drill-Down Navigation", () => {
    it("clicking 'My Open Tickets' navigates to My Tickets filtered by 'open'", async () => {
      const onNavigateMock = vi.fn();
      render(<RequesterDashboard onNavigateToTickets={onNavigateMock} />);

      const card = await screen.findByTestId("metric-card-open");
      fireEvent.click(card);

      expect(onNavigateMock).toHaveBeenCalledWith("open", undefined);
    });

    it("clicking 'In Progress' navigates to My Tickets filtered by 'IN_PROGRESS'", async () => {
      const onNavigateMock = vi.fn();
      render(<RequesterDashboard onNavigateToTickets={onNavigateMock} />);

      const card = await screen.findByTestId("metric-card-in-progress");
      fireEvent.click(card);

      expect(onNavigateMock).toHaveBeenCalledWith("IN_PROGRESS", undefined);
    });

    it("clicking 'Waiting for My Input' navigates to My Tickets filtered by 'WAITING_FOR_REQUESTER'", async () => {
      const onNavigateMock = vi.fn();
      render(<RequesterDashboard onNavigateToTickets={onNavigateMock} />);

      const card = await screen.findByTestId("metric-card-waiting-input");
      fireEvent.click(card);

      expect(onNavigateMock).toHaveBeenCalledWith("WAITING_FOR_REQUESTER", undefined);
    });

    it("clicking 'Resolved Recently' navigates to My Tickets with 'resolved-7d' and resolvedRange '7d'", async () => {
      const onNavigateMock = vi.fn();
      render(<RequesterDashboard onNavigateToTickets={onNavigateMock} />);

      const card = await screen.findByTestId("metric-card-resolved");
      fireEvent.click(card);

      expect(onNavigateMock).toHaveBeenCalledWith("resolved-7d", "7d");
    });

    it("clicking 'Closed' navigates to My Tickets filtered by 'CLOSED'", async () => {
      const onNavigateMock = vi.fn();
      render(<RequesterDashboard onNavigateToTickets={onNavigateMock} />);

      const card = await screen.findByTestId("metric-card-closed");
      fireEvent.click(card);

      expect(onNavigateMock).toHaveBeenCalledWith("CLOSED", undefined);
    });

    it("supports keyboard navigation with Enter and Space keys", async () => {
      const onNavigateMock = vi.fn();
      render(<RequesterDashboard onNavigateToTickets={onNavigateMock} />);

      const card = await screen.findByTestId("metric-card-open");
      fireEvent.keyDown(card, { key: "Enter" });
      expect(onNavigateMock).toHaveBeenCalledWith("open", undefined);

      fireEvent.keyDown(card, { key: " " });
      expect(onNavigateMock).toHaveBeenCalledTimes(2);
    });
  });

  describe("4. My Recent Tickets Widget", () => {
    it("renders the recent tickets table and mobile stacked cards without sideways scrolling", async () => {
      render(<RequesterDashboard />);

      expect(await screen.findByTestId("my-recent-tickets-widget")).toBeInTheDocument();
      expect(screen.getByTestId("requester-recent-tickets-table")).toBeInTheDocument();
      expect(screen.getByTestId("mobile-recent-tickets-cards")).toBeInTheDocument();

      expect(screen.getAllByText("TKT-2026-000001").length).toBeGreaterThan(0);
      expect(screen.getAllByText("VPN access connection failure").length).toBeGreaterThan(0);
      expect(screen.getAllByTestId("ticket-action-required-badge").length).toBeGreaterThan(0);
    });

    it("clicking ticket row calls onSelectTicket with ticket ID", async () => {
      const onSelectMock = vi.fn();
      render(<RequesterDashboard onSelectTicket={onSelectMock} />);

      const row = await screen.findByTestId("recent-ticket-row-tkt-001");
      fireEvent.click(row);

      expect(onSelectMock).toHaveBeenCalledWith("tkt-001");
    });

    it("clicking 'View Details' button calls onSelectTicket without bubbling issues", async () => {
      const onSelectMock = vi.fn();
      render(<RequesterDashboard onSelectTicket={onSelectMock} />);

      const viewBtn = await screen.findByTestId("view-ticket-tkt-002");
      fireEvent.click(viewBtn);

      expect(onSelectMock).toHaveBeenCalledWith("tkt-002");
    });

    it("clicking 'View All My Tickets' header link navigates to ticket list", async () => {
      const onNavigateMock = vi.fn();
      render(<RequesterDashboard onNavigateToTickets={onNavigateMock} />);

      const viewAllBtn = await screen.findByTestId("recent-tickets-view-all");
      fireEvent.click(viewAllBtn);

      expect(onNavigateMock).toHaveBeenCalled();
    });
  });

  describe("5. Quick Actions Widget", () => {
    it("clicking 'Create New Ticket' quick action triggers onCreateTicket", async () => {
      const onCreateMock = vi.fn();
      render(<RequesterDashboard onCreateTicket={onCreateMock} />);

      const btn = await screen.findByTestId("quick-action-create-ticket");
      fireEvent.click(btn);

      expect(onCreateMock).toHaveBeenCalledTimes(1);
    });

    it("clicking 'View All My Tickets' quick action triggers onNavigateToTickets", async () => {
      const onNavigateMock = vi.fn();
      render(<RequesterDashboard onNavigateToTickets={onNavigateMock} />);

      const btn = await screen.findByTestId("quick-action-view-my-tickets");
      fireEvent.click(btn);

      expect(onNavigateMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("6. Empty State Behavior", () => {
    it("displays clean empty state illustration when requester has 0 tickets", async () => {
      vi.spyOn(api, "fetchRequesterDashboard").mockResolvedValueOnce({
        metrics: {
          totalOpen: 0,
          totalActive: 0,
          waitingForRequester: 0,
          waitingForMyInput: 0,
          recentlyUpdated: 0,
          recentlyResolved: 0,
          resolvedRecently: 0,
          inProgress: 0,
          closed: 0,
        },
        recentTickets: [],
      });

      render(<RequesterDashboard />);

      expect(await screen.findByTestId("dashboard-empty-state")).toBeInTheDocument();
      expect(screen.getByText(/No tickets submitted yet/i)).toBeInTheDocument();
    });
  });

  describe("7. Error Handling & Refresh", () => {
    it("displays error banner and retry button when fetching dashboard fails", async () => {
      vi.spyOn(api, "fetchRequesterDashboard").mockRejectedValueOnce(new Error("Network timeout"));

      render(<RequesterDashboard />);

      expect(await screen.findByTestId("dashboard-error-banner")).toBeInTheDocument();
      expect(screen.getByText(/Network timeout/i)).toBeInTheDocument();

      // Retry button refetches
      vi.spyOn(api, "fetchRequesterDashboard").mockResolvedValueOnce(mockDashboardData);
      const retryBtn = screen.getByTestId("dashboard-retry-btn");
      fireEvent.click(retryBtn);

      expect(await screen.findByTestId("requester-dashboard-title")).toBeInTheDocument();
    });

    it("refresh button refetches dashboard data", async () => {
      render(<RequesterDashboard />);

      const refreshBtn = await screen.findByTestId("dashboard-refresh-btn");
      fireEvent.click(refreshBtn);

      await waitFor(() => {
        expect(api.fetchRequesterDashboard).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe("8. Global Navigation Header Integration", () => {
    it("renders dynamic 'Dashboard' link for authenticated Requester", () => {
      const onTabChange = vi.fn();
      render(
        <Header
          activeTab="requester-dashboard"
          onTabChange={onTabChange}
        />
      );

      const dashboardNavBtn = screen.getByTestId("nav-requester-dashboard");
      expect(dashboardNavBtn).toBeInTheDocument();
      expect(dashboardNavBtn).toHaveTextContent("Dashboard");
      expect(dashboardNavBtn).toHaveClass("btn-light fw-bold text-success");

      const myTicketsNavBtn = screen.getByTestId("nav-my-tickets");
      expect(myTicketsNavBtn).toBeInTheDocument();
      expect(myTicketsNavBtn).toHaveClass("btn-outline-light");

      fireEvent.click(dashboardNavBtn);
      expect(onTabChange).toHaveBeenCalledWith("requester-dashboard");
    });

    it("highlights 'My Tickets' when activeTab is my-tickets", () => {
      render(
        <Header
          activeTab="my-tickets"
          onTabChange={vi.fn()}
        />
      );

      const dashboardNavBtn = screen.getByTestId("nav-requester-dashboard");
      expect(dashboardNavBtn).toHaveClass("btn-outline-light");

      const myTicketsNavBtn = screen.getByTestId("nav-my-tickets");
      expect(myTicketsNavBtn).toHaveClass("btn-light fw-bold text-success");
    });

    it("enforces role-based navigation: hides Ticket Queue and User Management for Requesters", () => {
      render(
        <Header
          activeTab="requester-dashboard"
          onTabChange={vi.fn()}
        />
      );

      expect(screen.queryByTestId("nav-ticket-queue")).not.toBeInTheDocument();
      expect(screen.queryByTestId("nav-user-management")).not.toBeInTheDocument();
    });
  });

  describe("9. Full App Flow & Acceptance Criteria Verification", () => {
    it("allows authenticated Requester to navigate from header to Dashboard and drill down to filtered tickets", async () => {
      render(<App />);

      // 1. Initial render has Header with Dashboard button
      const dashboardNavBtn = await screen.findByTestId("nav-requester-dashboard");
      expect(dashboardNavBtn).toBeInTheDocument();

      // 2. Click Dashboard in navigation
      fireEvent.click(dashboardNavBtn);

      // 3. Lands on Requester Dashboard
      expect(await screen.findByTestId("requester-dashboard")).toBeInTheDocument();
      expect(screen.getByTestId("requester-dashboard-title")).toHaveTextContent("My IT Support Dashboard");

      // 4. Click 'In Progress' metric card
      const inProgressCard = await screen.findByTestId("metric-card-in-progress");
      fireEvent.click(inProgressCard);

      // 5. Navigates to My Tickets filtered by IN_PROGRESS
      const statusFilter = (await screen.findByTestId("status-filter")) as HTMLSelectElement;
      expect(statusFilter.value).toBe("IN_PROGRESS");
    });

    it("clears drill-down filter when navigating to My Tickets from header", async () => {
      render(<App />);

      // 1. Navigate to dashboard and drill down to IN_PROGRESS
      const dashboardNavBtn = await screen.findByTestId("nav-requester-dashboard");
      fireEvent.click(dashboardNavBtn);

      const inProgressCard = await screen.findByTestId("metric-card-in-progress");
      fireEvent.click(inProgressCard);

      const statusFilter = (await screen.findByTestId("status-filter")) as HTMLSelectElement;
      expect(statusFilter.value).toBe("IN_PROGRESS");

      // 2. Click 'My Tickets' in the header
      const myTicketsNavBtn = screen.getByTestId("nav-my-tickets");
      fireEvent.click(myTicketsNavBtn);

      // 3. Status filter is reset back to all statuses
      await waitFor(() => {
        expect((screen.getByTestId("status-filter") as HTMLSelectElement).value).toBe("");
      });
    });

    it("clears drill-down filter when returning to My Tickets after creating a ticket", async () => {
      render(<App />);

      // 1. Navigate to dashboard and drill down to resolved-7d
      const dashboardNavBtn = await screen.findByTestId("nav-requester-dashboard");
      fireEvent.click(dashboardNavBtn);

      const resolvedCard = await screen.findByTestId("metric-card-resolved");
      fireEvent.click(resolvedCard);

      const statusFilter = (await screen.findByTestId("status-filter")) as HTMLSelectElement;
      expect(statusFilter.value).toBe("resolved-7d");

      // 2. Click Create Ticket
      const createNavBtn = screen.getByTestId("nav-create-ticket");
      fireEvent.click(createNavBtn);

      // 3. Cancel creating ticket
      const cancelBtn = await screen.findByRole("button", { name: /cancel/i });
      fireEvent.click(cancelBtn);

      // 4. Filter is reset to empty string so newly created tickets are visible
      const resetFilter = (await screen.findByTestId("status-filter")) as HTMLSelectElement;
      expect(resetFilter.value).toBe("");
    });

    it("routes directly to Requester Dashboard when window.location.pathname is /requester/dashboard or /dashboard", async () => {
      window.history.pushState(null, "", "/requester/dashboard");
      render(<App />);

      expect(await screen.findByTestId("requester-dashboard")).toBeInTheDocument();
      expect(screen.getByTestId("requester-dashboard-title")).toHaveTextContent("My IT Support Dashboard");

      // Reset URL
      window.history.pushState(null, "", "/");
    });

    it("redirects IT_STAFF to staff-dashboard when URL is /tickets", async () => {
      window.history.pushState(null, "", "/tickets");
      const staffUser: api.AuthUser = {
        id: "u_staff_lisa",
        name: "Lisa Martinez",
        email: "lisa.martinez@toktickit.com",
        role: "IT_STAFF",
        mustChangePassword: false,
      };
      vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
        user: staffUser,
        isAuthenticated: true,
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
        changePassword: vi.fn(),
        refreshUser: vi.fn(),
      });
      vi.spyOn(api, "fetchStaffDashboard").mockResolvedValue({
        metrics: {
          totalOpen: 10,
          unassigned: 2,
          ownedByMe: 3,
          myAssigned: 3,
          waitingForRequester: 1,
          urgentOrHigh: 2,
          resolvedToday: 4,
          avgResolutionMinutes: 120,
          avgResolutionFormatted: "2h",
          recentlyUpdated: 5,
        },
        breakdown: { byStatus: [], byPriority: [] },
        recentTickets: [],
        calculatedAt: "2026-10-31T00:00:00.000Z",
      });

      render(<App />);

      expect(await screen.findByTestId("staff-dashboard")).toBeInTheDocument();
      expect(screen.getByTestId("nav-staff-dashboard")).toHaveClass("btn-light");
      expect(window.location.pathname).toBe("/staff/dashboard");

      window.history.pushState(null, "", "/");
    });

    it("reads query string filter on initial page load (e.g. /tickets?status=CLOSED)", async () => {
      window.history.pushState(null, "", "/tickets?status=CLOSED");
      render(<App />);

      const statusFilter = (await screen.findByTestId("status-filter")) as HTMLSelectElement;
      expect(statusFilter.value).toBe("CLOSED");

      window.history.pushState(null, "", "/");
    });

    it("updates URL to /tickets when returning via handleBackToMyTickets", async () => {
      window.history.pushState(null, "", "/tickets?status=CLOSED");
      render(<App />);

      const createNavBtn = await screen.findByTestId("nav-create-ticket");
      fireEvent.click(createNavBtn);

      const cancelBtn = await screen.findByRole("button", { name: /cancel/i });
      fireEvent.click(cancelBtn);

      expect(window.location.pathname).toBe("/tickets");
      expect(window.location.search).toBe("");

      window.history.pushState(null, "", "/");
    });

    it("handles browser back (popstate) for staff on /requester/dashboard using userRef without 403", async () => {
      window.history.pushState(null, "", "/staff/dashboard");
      const staffUser: api.AuthUser = {
        id: "u_staff_lisa",
        name: "Lisa Martinez",
        email: "lisa.martinez@toktickit.com",
        role: "IT_STAFF",
        mustChangePassword: false,
      };
      vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
        user: staffUser,
        isAuthenticated: true,
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
        changePassword: vi.fn(),
        refreshUser: vi.fn(),
      });
      vi.spyOn(api, "fetchStaffDashboard").mockResolvedValue({
        metrics: {
          totalOpen: 10,
          unassigned: 2,
          ownedByMe: 3,
          myAssigned: 3,
          waitingForRequester: 1,
          urgentOrHigh: 2,
          resolvedToday: 4,
          avgResolutionMinutes: 120,
          avgResolutionFormatted: "2h",
          recentlyUpdated: 5,
        },
        breakdown: { byStatus: [], byPriority: [] },
        recentTickets: [],
        calculatedAt: "2026-10-31T00:00:00.000Z",
      });

      render(<App />);
      expect(await screen.findByTestId("staff-dashboard")).toBeInTheDocument();

      // Simulate browser back to requester dashboard
      window.history.pushState(null, "", "/requester/dashboard");
      window.dispatchEvent(new PopStateEvent("popstate"));

      // Staff should remain on staff dashboard
      expect(await screen.findByTestId("staff-dashboard")).toBeInTheDocument();
      expect(screen.queryByTestId("requester-dashboard")).not.toBeInTheDocument();

      window.history.pushState(null, "", "/");
    });

    it("does not jump away from active view when user state updates without role/id change", async () => {
      let authUser: api.AuthUser = { ...requesterUser };
      const authSpy = vi.spyOn(AuthContextModule, "useAuth");
      authSpy.mockImplementation(() => ({
        user: authUser,
        isAuthenticated: true,
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
        changePassword: vi.fn(),
        refreshUser: vi.fn(),
      }));

      const { rerender } = render(<App />);

      // Navigate to requester dashboard
      const dashboardNavBtn = await screen.findByTestId("nav-requester-dashboard");
      fireEvent.click(dashboardNavBtn);
      expect(await screen.findByTestId("requester-dashboard")).toBeInTheDocument();

      // User state updates (e.g. voluntary password change updating mustChangePassword)
      authUser = { ...authUser, mustChangePassword: false };
      rerender(<App />);

      // Should remain on requester dashboard, not reset to default tab
      expect(screen.getByTestId("requester-dashboard")).toBeInTheDocument();
    });
  });
});
