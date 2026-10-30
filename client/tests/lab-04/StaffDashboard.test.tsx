import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { StaffDashboard } from "../../src/pages/StaffDashboard";
import * as api from "../../src/api";
import * as AuthContextModule from "../../src/context/AuthContext";

describe("IT Staff & Administrator Dashboard Component Tests (StaffDashboard.test.tsx - Feature 29)", () => {
  const staffUser: api.AuthUser = {
    id: "u_staff_1",
    name: "Alex Thompson",
    email: "alex@toktickit.com",
    role: "IT_STAFF",
    mustChangePassword: false,
  };

  const adminUser: api.AuthUser = {
    id: "u_admin_1",
    name: "Admin User",
    email: "admin@toktickit.com",
    role: "ADMINISTRATOR",
    mustChangePassword: false,
  };

  const mockDashboardData: api.StaffDashboardResponse = {
    metrics: {
      totalOpen: 48,
      unassigned: 12,
      ownedByMe: 7,
      myAssigned: 7,
      waitingForRequester: 9,
      urgentOrHigh: 6,
      resolvedToday: 14,
      avgResolutionMinutes: 225,
      avgResolutionFormatted: "3h 45m",
      recentlyUpdated: 23,
    },
    breakdown: {
      byStatus: [
        { status: "NEW", count: 10, percentage: 20.8 },
        { status: "OPEN", count: 15, percentage: 31.3 },
        { status: "IN_PROGRESS", count: 14, percentage: 29.2 },
        { status: "WAITING_FOR_REQUESTER", count: 9, percentage: 18.7 },
        { status: "RESOLVED", count: 14, percentage: 0 },
      ],
      byPriority: [
        { priority: "URGENT", count: 6, percentage: 12.5 },
        { priority: "HIGH", count: 12, percentage: 25.0 },
        { priority: "MEDIUM", count: 20, percentage: 41.7 },
        { priority: "LOW", count: 10, percentage: 20.8 },
      ],
    },
    recentTickets: [
      {
        id: "tkt-001",
        ticketNumber: "TKT-2026-000001",
        summary: "Core switch link flap in IDF 2",
        requesterName: "Jennifer Anderson",
        itPriority: "HIGH",
        currentStatus: "IN_PROGRESS",
        ownerName: "Alex Thompson",
        updatedAt: "2026-10-31T01:30:00.000Z",
      },
      {
        id: "tkt-002",
        ticketNumber: "TKT-2026-000002",
        summary: "Database latency alert",
        requesterName: "Marcus Vance",
        itPriority: "URGENT",
        currentStatus: "NEW",
        ownerName: null,
        updatedAt: "2026-10-31T01:45:00.000Z",
      },
    ],
    recentUrgentTickets: [
      {
        id: "tkt-002",
        ticketNumber: "TKT-2026-000002",
        summary: "Database latency alert",
        requesterName: "Marcus Vance",
        itPriority: "URGENT",
        currentStatus: "NEW",
        ownerName: null,
        updatedAt: "2026-10-31T01:45:00.000Z",
      },
    ],
    adminOverview: {
      totalUsers: 25,
      activeStaff: 6,
      activeRequesters: 18,
    },
    calculatedAt: "2026-10-31T02:00:00.000Z",
    timeWindowDays: 30,
  };

  const mockAuth = (user: api.AuthUser | null) => {
    vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
      user,
      isAuthenticated: !!user,
      isLoading: false,
      login: async () => ({} as api.AuthUser),
      logout: async () => {},
      changePassword: async () => {},
      refreshUser: async () => {},
    });
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("1. Live Backend Metric Cards Rendering & Zen Green Styling", () => {
    it("renders dashboard title, subtitle, refresh button and all 8 KPI metric cards", async () => {
      mockAuth(staffUser);
      vi.spyOn(api, "fetchStaffDashboard").mockResolvedValue(mockDashboardData);

      render(<StaffDashboard />);

      expect(await screen.findByTestId("dashboard-title")).toHaveTextContent("Operations Dashboard");
      expect(screen.getByText(/Real-time queue health/i)).toBeInTheDocument();
      expect(screen.getByTestId("dashboard-refresh-btn")).toBeInTheDocument();

      // Check all metric values
      expect(screen.getByTestId("metric-card-unassigned-value")).toHaveTextContent("12");
      expect(screen.getByTestId("metric-card-my-assigned-value")).toHaveTextContent("7");
      expect(screen.getByTestId("metric-card-in-progress-value")).toHaveTextContent("14");
      expect(screen.getByTestId("metric-card-waiting-for-requester-value")).toHaveTextContent("9");
      expect(screen.getByTestId("metric-card-urgent-or-high-value")).toHaveTextContent("6");
      expect(screen.getByTestId("metric-card-total-open-value")).toHaveTextContent("48");
      expect(screen.getByTestId("metric-card-resolved-today-value")).toHaveTextContent("14");
      expect(screen.getByTestId("metric-card-avg-resolution-time-value")).toHaveTextContent("3h 45m");
    });

    it("handles zero values and defaults safely without crashing", async () => {
      mockAuth(staffUser);
      vi.spyOn(api, "fetchStaffDashboard").mockResolvedValue({
        metrics: {
          totalOpen: 0,
          unassigned: 0,
          ownedByMe: 0,
          myAssigned: 0,
          waitingForRequester: 0,
          urgentOrHigh: 0,
          resolvedToday: 0,
          avgResolutionMinutes: 0,
          avgResolutionFormatted: "0m",
          recentlyUpdated: 0,
        },
        recentTickets: [],
        recentUrgentTickets: [],
      });

      render(<StaffDashboard />);

      expect(await screen.findByTestId("metric-card-total-open-value")).toHaveTextContent("0");
      expect(screen.getByTestId("metric-card-avg-resolution-time-value")).toHaveTextContent("0m");
      expect(screen.getByTestId("dashboard-empty-state")).toBeInTheDocument();
    });
  });

  describe("2. Interactive Metric Drill-Down Navigation", () => {
    it("triggers filtered navigation when clicking Unassigned metric card", async () => {
      mockAuth(staffUser);
      vi.spyOn(api, "fetchStaffDashboard").mockResolvedValue(mockDashboardData);
      const onNavigateToQueue = vi.fn();

      render(<StaffDashboard onNavigateToQueue={onNavigateToQueue} />);

      const unassignedCard = await screen.findByTestId("metric-card-unassigned");
      fireEvent.click(unassignedCard);

      expect(onNavigateToQueue).toHaveBeenCalledWith({ ownership: "unassigned" });
    });

    it("triggers filtered navigation when clicking My Assigned card", async () => {
      mockAuth(staffUser);
      vi.spyOn(api, "fetchStaffDashboard").mockResolvedValue(mockDashboardData);
      const onNavigateToQueue = vi.fn();

      render(<StaffDashboard onNavigateToQueue={onNavigateToQueue} />);

      const myAssignedCard = await screen.findByTestId("metric-card-my-assigned");
      fireEvent.click(myAssignedCard);

      expect(onNavigateToQueue).toHaveBeenCalledWith({ ownership: "me" });
    });

    it("triggers filtered navigation when clicking In Progress card", async () => {
      mockAuth(staffUser);
      vi.spyOn(api, "fetchStaffDashboard").mockResolvedValue(mockDashboardData);
      const onNavigateToQueue = vi.fn();

      render(<StaffDashboard onNavigateToQueue={onNavigateToQueue} />);

      const inProgressCard = await screen.findByTestId("metric-card-in-progress");
      fireEvent.click(inProgressCard);

      expect(onNavigateToQueue).toHaveBeenCalledWith({ status: "IN_PROGRESS" });
    });

    it("triggers filtered navigation when clicking Waiting for Requester card", async () => {
      mockAuth(staffUser);
      vi.spyOn(api, "fetchStaffDashboard").mockResolvedValue(mockDashboardData);
      const onNavigateToQueue = vi.fn();

      render(<StaffDashboard onNavigateToQueue={onNavigateToQueue} />);

      const waitingCard = await screen.findByTestId("metric-card-waiting-for-requester");
      fireEvent.click(waitingCard);

      expect(onNavigateToQueue).toHaveBeenCalledWith({ status: "WAITING_FOR_REQUESTER" });
    });

    it("triggers filtered navigation when clicking High / Urgent card", async () => {
      mockAuth(staffUser);
      vi.spyOn(api, "fetchStaffDashboard").mockResolvedValue(mockDashboardData);
      const onNavigateToQueue = vi.fn();

      render(<StaffDashboard onNavigateToQueue={onNavigateToQueue} />);

      const urgentCard = await screen.findByTestId("metric-card-urgent-or-high");
      fireEvent.click(urgentCard);

      expect(onNavigateToQueue).toHaveBeenCalledWith({ priority: "URGENT,HIGH", status: "open" });
    });

    it("triggers filtered navigation when clicking Total Open card", async () => {
      mockAuth(staffUser);
      vi.spyOn(api, "fetchStaffDashboard").mockResolvedValue(mockDashboardData);
      const onNavigateToQueue = vi.fn();

      render(<StaffDashboard onNavigateToQueue={onNavigateToQueue} />);

      const totalOpenCard = await screen.findByTestId("metric-card-total-open");
      fireEvent.click(totalOpenCard);

      expect(onNavigateToQueue).toHaveBeenCalledWith({ status: "open" });
    });

    it("triggers keyboard navigation with Enter or Space key", async () => {
      mockAuth(staffUser);
      vi.spyOn(api, "fetchStaffDashboard").mockResolvedValue(mockDashboardData);
      const onNavigateToQueue = vi.fn();

      render(<StaffDashboard onNavigateToQueue={onNavigateToQueue} />);

      const unassignedCard = await screen.findByTestId("metric-card-unassigned");
      fireEvent.keyDown(unassignedCard, { key: "Enter" });

      expect(onNavigateToQueue).toHaveBeenCalledWith({ ownership: "unassigned" });
    });
  });

  describe("3. Operational Recent Tickets Panel & Detail Links", () => {
    it("renders recent tickets list with status and priority badges", async () => {
      mockAuth(staffUser);
      vi.spyOn(api, "fetchStaffDashboard").mockResolvedValue(mockDashboardData);

      render(<StaffDashboard />);

      expect(await screen.findByText("TKT-2026-000001")).toBeInTheDocument();
      expect(screen.getByText("Core switch link flap in IDF 2")).toBeInTheDocument();
      expect(screen.getByText("Jennifer Anderson")).toBeInTheDocument();
      expect(screen.getByText("Alex Thompson")).toBeInTheDocument();

      // Second ticket is unassigned
      expect(screen.getByText("TKT-2026-000002")).toBeInTheDocument();
      const unassignedElements = screen.getAllByText("Unassigned");
      expect(unassignedElements.length).toBeGreaterThanOrEqual(2);
    });

    it("navigates to ticket detail when clicking ticket row or View button", async () => {
      mockAuth(staffUser);
      vi.spyOn(api, "fetchStaffDashboard").mockResolvedValue(mockDashboardData);
      const onSelectTicket = vi.fn();

      render(<StaffDashboard onSelectTicket={onSelectTicket} />);

      const row = await screen.findByTestId("recent-ticket-row-tkt-001");
      fireEvent.click(row);

      expect(onSelectTicket).toHaveBeenCalledWith("tkt-001");

      const viewBtn = screen.getByTestId("view-detail-btn-tkt-002");
      fireEvent.click(viewBtn);

      expect(onSelectTicket).toHaveBeenCalledWith("tkt-002");
    });

    it("switches to Urgent tickets tab when clicked", async () => {
      mockAuth(staffUser);
      vi.spyOn(api, "fetchStaffDashboard").mockResolvedValue(mockDashboardData);

      render(<StaffDashboard />);

      const urgentTab = await screen.findByTestId("tab-urgent-tickets");
      fireEvent.click(urgentTab);

      expect(screen.getByText("TKT-2026-000002")).toBeInTheDocument();
      // tkt-001 is HIGH priority, not in recentUrgentTickets
      expect(screen.queryByText("TKT-2026-000001")).not.toBeInTheDocument();
    });

    it("navigates to full queue when clicking View All Queue button or Full Queue link", async () => {
      mockAuth(staffUser);
      vi.spyOn(api, "fetchStaffDashboard").mockResolvedValue(mockDashboardData);
      const onNavigateToQueue = vi.fn();

      render(<StaffDashboard onNavigateToQueue={onNavigateToQueue} />);

      const viewAllBtn = await screen.findByTestId("dashboard-view-all-queue-btn");
      fireEvent.click(viewAllBtn);
      expect(onNavigateToQueue).toHaveBeenCalled();

      const fullQueueLink = screen.getByTestId("view-full-queue-link");
      fireEvent.click(fullQueueLink);
      expect(onNavigateToQueue).toHaveBeenCalledTimes(2);
    });
  });

  describe("4. Quick Actions Panel", () => {
    it("handles Create Ticket quick action", async () => {
      mockAuth(staffUser);
      vi.spyOn(api, "fetchStaffDashboard").mockResolvedValue(mockDashboardData);
      const onCreateTicket = vi.fn();

      render(<StaffDashboard onCreateTicket={onCreateTicket} />);

      const createBtn = await screen.findByTestId("quick-action-create-ticket");
      fireEvent.click(createBtn);

      expect(onCreateTicket).toHaveBeenCalled();
    });

    it("handles View My Assigned Queue quick action", async () => {
      mockAuth(staffUser);
      vi.spyOn(api, "fetchStaffDashboard").mockResolvedValue(mockDashboardData);
      const onNavigateToQueue = vi.fn();

      render(<StaffDashboard onNavigateToQueue={onNavigateToQueue} />);

      const myQueueBtn = await screen.findByTestId("quick-action-my-queue");
      fireEvent.click(myQueueBtn);

      expect(onNavigateToQueue).toHaveBeenCalledWith({ ownership: "me" });
    });

    it("handles Search All Tickets quick action", async () => {
      mockAuth(staffUser);
      vi.spyOn(api, "fetchStaffDashboard").mockResolvedValue(mockDashboardData);
      const onNavigateToQueue = vi.fn();

      render(<StaffDashboard onNavigateToQueue={onNavigateToQueue} />);

      const searchBtn = await screen.findByTestId("quick-action-search-tickets");
      fireEvent.click(searchBtn);

      expect(onNavigateToQueue).toHaveBeenCalledWith({ search: "" });
    });

    it("handles Triage Urgent Issues quick action", async () => {
      mockAuth(staffUser);
      vi.spyOn(api, "fetchStaffDashboard").mockResolvedValue(mockDashboardData);
      const onNavigateToQueue = vi.fn();

      render(<StaffDashboard onNavigateToQueue={onNavigateToQueue} />);

      const triageBtn = await screen.findByTestId("quick-action-urgent-tickets");
      fireEvent.click(triageBtn);

      expect(onNavigateToQueue).toHaveBeenCalledWith({ priority: "URGENT", status: "open" });
    });
  });

  describe("5. Loading Skeleton & Error Retry State Handling", () => {
    it("displays skeleton placeholder while fetching metrics", () => {
      mockAuth(staffUser);
      vi.spyOn(api, "fetchStaffDashboard").mockReturnValue(new Promise(() => {})); // Never resolves

      render(<StaffDashboard />);

      expect(screen.getByTestId("dashboard-skeleton")).toBeInTheDocument();
    });

    it("displays error banner on API rejection and retries fetch successfully", async () => {
      mockAuth(staffUser);
      const fetchSpy = vi.spyOn(api, "fetchStaffDashboard")
        .mockRejectedValueOnce(new Error("Network timeout"))
        .mockResolvedValueOnce(mockDashboardData);

      render(<StaffDashboard />);

      expect(await screen.findByTestId("dashboard-error-banner")).toBeInTheDocument();
      expect(screen.getByText(/Network timeout/i)).toBeInTheDocument();

      const retryBtn = screen.getByTestId("dashboard-retry-btn");
      fireEvent.click(retryBtn);

      await waitFor(() => {
        expect(screen.queryByTestId("dashboard-error-banner")).not.toBeInTheDocument();
        expect(screen.getByTestId("dashboard-title")).toBeInTheDocument();
      });

      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe("6. Role-Based Scoping & Admin Overview", () => {
    it("renders Administrator Overview panel for ADMINISTRATOR role", async () => {
      mockAuth(adminUser);
      vi.spyOn(api, "fetchStaffDashboard").mockResolvedValue(mockDashboardData);

      render(<StaffDashboard />);

      expect(await screen.findByTestId("admin-overview-widget")).toBeInTheDocument();
      expect(screen.getByTestId("admin-total-users")).toHaveTextContent("25");
      expect(screen.getByTestId("admin-active-staff")).toHaveTextContent("6");
      expect(screen.getByTestId("admin-active-requesters")).toHaveTextContent("18");
    });

    it("hides Administrator Overview panel for IT_STAFF role", async () => {
      mockAuth(staffUser);
      vi.spyOn(api, "fetchStaffDashboard").mockResolvedValue(mockDashboardData);

      render(<StaffDashboard />);

      await screen.findByTestId("dashboard-title");
      expect(screen.queryByTestId("admin-overview-widget")).not.toBeInTheDocument();
    });
  });
});
