import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { TicketWorkflowControls } from "../../src/components/TicketWorkflowControls";
import { RequesterTicketDetail } from "../../src/pages/RequesterTicketDetail";
import * as api from "../../src/api";
import * as AuthContextModule from "../../src/context/AuthContext";

describe("Ticket Workflow & Status Transitions UI Component Tests (TicketWorkflow.test.tsx - Feature 27)", () => {
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

  const requesterUser: api.AuthUser = {
    id: "u_req_1",
    name: "Jennifer Anderson",
    email: "jennifer@toktickit.com",
    role: "REQUESTER",
    mustChangePassword: false,
  };

  const createMockTicket = (status: api.TicketStatus): api.TicketDetail => ({
    id: "tkt-100",
    ticketNumber: "TKT-2026-000100",
    summary: "Office network switch failure",
    description: "Switch in IDF-2 is not linking up.",
    categoryId: "cat-net",
    category: { id: "cat-net", name: "Network" },
    relatedSystemId: "sys-sw",
    relatedSystem: { id: "sys-sw", name: "Switch" },
    requestedPriority: "HIGH",
    itPriority: "HIGH",
    currentStatus: status,
    requesterId: "u_req_1",
    requester: { id: "u_req_1", name: "Jennifer Anderson", email: "jennifer@toktickit.com" },
    createdAt: "2026-10-30T00:00:00.000Z",
    updatedAt: "2026-10-30T00:10:00.000Z",
    attachments: [],
  });

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

  describe("1. Contract Matrix Permitted Status Transitions (AC-01)", () => {
    it("renders only valid next transitions for NEW status (OPEN, IN_PROGRESS, CANCELLED)", () => {
      mockAuth(staffUser);
      const ticket = createMockTicket("NEW");
      const onStatusUpdated = vi.fn();
      const onRefreshTicket = vi.fn();

      render(
        <TicketWorkflowControls
          ticket={ticket}
          onStatusUpdated={onStatusUpdated}
          onRefreshTicket={onRefreshTicket}
        />
      );

      expect(screen.getByTestId("staff-workflow-card")).toBeInTheDocument();

      // Check dropdown options
      const select = screen.getByTestId("status-transition-select") as HTMLSelectElement;
      const options = Array.from(select.options).map((o) => o.value).filter(Boolean);
      expect(options).toEqual(["OPEN", "IN_PROGRESS", "CANCELLED"]);

      // Disallowed transitions like RESOLVED and CLOSED must not exist in options
      expect(options).not.toContain("RESOLVED");
      expect(options).not.toContain("CLOSED");
      expect(options).not.toContain("WAITING_FOR_REQUESTER");

      // Check shortcut action buttons
      expect(screen.getByTestId("transition-to-open")).toBeInTheDocument();
      expect(screen.getByTestId("transition-to-in-progress")).toBeInTheDocument();
      expect(screen.getByTestId("transition-to-cancelled")).toBeInTheDocument();
      expect(screen.queryByTestId("transition-to-resolved")).not.toBeInTheDocument();
      expect(screen.queryByTestId("transition-to-closed")).not.toBeInTheDocument();
    });

    it("renders only valid next transitions for OPEN status (IN_PROGRESS, WAITING_FOR_REQUESTER, RESOLVED, CANCELLED)", () => {
      mockAuth(staffUser);
      const ticket = createMockTicket("OPEN");

      render(
        <TicketWorkflowControls
          ticket={ticket}
          onStatusUpdated={vi.fn()}
          onRefreshTicket={vi.fn()}
        />
      );

      const select = screen.getByTestId("status-transition-select") as HTMLSelectElement;
      const options = Array.from(select.options).map((o) => o.value).filter(Boolean);
      expect(options).toEqual(["IN_PROGRESS", "WAITING_FOR_REQUESTER", "RESOLVED", "CANCELLED"]);
      expect(options).not.toContain("CLOSED");
      expect(options).not.toContain("NEW");
    });

    it("renders only valid next transitions for RESOLVED status (CLOSED, REOPENED)", () => {
      mockAuth(staffUser);
      const ticket = createMockTicket("RESOLVED");

      render(
        <TicketWorkflowControls
          ticket={ticket}
          onStatusUpdated={vi.fn()}
          onRefreshTicket={vi.fn()}
        />
      );

      const select = screen.getByTestId("status-transition-select") as HTMLSelectElement;
      const options = Array.from(select.options).map((o) => o.value).filter(Boolean);
      expect(options).toEqual(["CLOSED", "REOPENED"]);
      expect(options).not.toContain("IN_PROGRESS");
    });

    it("renders terminal notice for CLOSED status without any transition controls", () => {
      mockAuth(staffUser);
      const ticket = createMockTicket("CLOSED");

      render(
        <TicketWorkflowControls
          ticket={ticket}
          onStatusUpdated={vi.fn()}
          onRefreshTicket={vi.fn()}
        />
      );

      expect(screen.getByTestId("terminal-status-notice")).toBeInTheDocument();
      expect(screen.queryByTestId("status-transition-select")).not.toBeInTheDocument();
      expect(screen.queryByTestId("apply-status-transition-btn")).not.toBeInTheDocument();
    });

    it("excludes staff workflow transition controls completely for Requester role", () => {
      mockAuth(requesterUser);
      const ticket = createMockTicket("IN_PROGRESS");

      render(
        <TicketWorkflowControls
          ticket={ticket}
          onStatusUpdated={vi.fn()}
          onRefreshTicket={vi.fn()}
        />
      );

      expect(screen.queryByTestId("staff-workflow-card")).not.toBeInTheDocument();
      expect(screen.queryByTestId("status-transition-select")).not.toBeInTheDocument();
      expect(screen.getByTestId("problem-resolved-btn")).toBeInTheDocument();
    });
  });

  describe("2. Resolution Verification Prompt & Review Modals (AC-02)", () => {
    it("opens Resolution Gate confirmation modal when RESOLVED is selected and enforces min 10 chars summary", async () => {
      mockAuth(staffUser);
      const ticket = createMockTicket("IN_PROGRESS");
      const onStatusUpdated = vi.fn();
      vi.spyOn(api, "updateTicketStatus").mockResolvedValue({
        message: "Ticket status updated",
        ticketId: "tkt-100",
        currentStatus: "RESOLVED",
      });

      render(
        <TicketWorkflowControls
          ticket={ticket}
          onStatusUpdated={onStatusUpdated}
          onRefreshTicket={vi.fn()}
        />
      );

      // Select RESOLVED from dropdown and apply
      const select = screen.getByTestId("status-transition-select");
      fireEvent.change(select, { target: { value: "RESOLVED" } });
      fireEvent.click(screen.getByTestId("apply-status-transition-btn"));

      // Resolution modal opens
      expect(await screen.findByTestId("resolve-modal")).toBeInTheDocument();
      expect(screen.getByText(/Confirm Ticket Resolution/i)).toBeInTheDocument();

      const confirmBtn = screen.getByTestId("confirm-resolve-btn");
      const summaryInput = screen.getByTestId("resolution-summary-input");

      // Confirm button disabled when summary is empty or < 10 characters
      expect(confirmBtn).toBeDisabled();

      fireEvent.change(summaryInput, { target: { value: "Too short" } }); // 9 chars
      expect(confirmBtn).toBeDisabled();
      expect(screen.getByTestId("resolution-summary-error")).toBeInTheDocument();

      // Enter valid summary (>= 10 chars)
      fireEvent.change(summaryInput, {
        target: { value: "Replaced faulty transceiver and verified port link restored." },
      });
      expect(confirmBtn).toBeEnabled();

      // Submit resolution
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(api.updateTicketStatus).toHaveBeenCalledWith(
          "tkt-100",
          "RESOLVED",
          undefined,
          "2026-10-30T00:10:00.000Z",
          "Replaced faulty transceiver and verified port link restored."
        );
      });

      await waitFor(() => {
        expect(onStatusUpdated).toHaveBeenCalledWith(
          "RESOLVED",
          "Replaced faulty transceiver and verified port link restored."
        );
      });

      // Modal closes
      expect(screen.queryByTestId("resolve-modal")).not.toBeInTheDocument();
    });

    it("opens Confirmation Modal when CLOSED is selected", async () => {
      mockAuth(staffUser);
      const ticket = createMockTicket("RESOLVED");
      vi.spyOn(api, "updateTicketStatus").mockResolvedValue({
        message: "Ticket status updated",
        ticketId: "tkt-100",
        currentStatus: "CLOSED",
      });

      render(
        <TicketWorkflowControls
          ticket={ticket}
          onStatusUpdated={vi.fn()}
          onRefreshTicket={vi.fn()}
        />
      );

      // Click shortcut button to close
      fireEvent.click(screen.getByTestId("transition-to-closed"));

      expect(await screen.findByTestId("close-ticket-modal")).toBeInTheDocument();
      expect(screen.getByText(/Confirm Ticket Closure/i)).toBeInTheDocument();

      const confirmCloseBtn = screen.getByTestId("confirm-close-btn");
      fireEvent.click(confirmCloseBtn);

      await waitFor(() => {
        expect(api.updateTicketStatus).toHaveBeenCalledWith(
          "tkt-100",
          "CLOSED",
          undefined,
          "2026-10-30T00:10:00.000Z",
          undefined
        );
      });
    });
  });

  describe("3. Advisory Indicator for Requester Problem Resolution", () => {
    it("renders advisory indicator for IT Staff when ticket is in WAITING_FOR_REQUESTER status", () => {
      mockAuth(staffUser);
      const ticket = createMockTicket("WAITING_FOR_REQUESTER");

      render(
        <TicketWorkflowControls
          ticket={ticket}
          onStatusUpdated={vi.fn()}
          onRefreshTicket={vi.fn()}
        />
      );

      expect(screen.getByTestId("workflow-advisory-indicator")).toBeInTheDocument();
      expect(screen.getByTestId("requester-resolved-advisory")).toBeInTheDocument();
      expect(screen.getByText(/Requester Feedback \/ Resolution Advisory/i)).toBeInTheDocument();
    });

    it("does not render advisory indicator when ticket is in other statuses", () => {
      mockAuth(staffUser);
      const ticket = createMockTicket("IN_PROGRESS");

      render(
        <TicketWorkflowControls
          ticket={ticket}
          onStatusUpdated={vi.fn()}
          onRefreshTicket={vi.fn()}
        />
      );

      expect(screen.queryByTestId("workflow-advisory-indicator")).not.toBeInTheDocument();
    });
  });

  describe("4. Optimistic Concurrency Conflict Handling (AC-03, 409 Conflict)", () => {
    it("displays safe 409 Conflict warning banner when server rejects update with conflict", async () => {
      mockAuth(staffUser);
      const ticket = createMockTicket("OPEN");
      const onRefreshTicket = vi.fn();

      const conflictError: any = new Error("This ticket was updated by another user.");
      conflictError.status = 409;
      conflictError.code = "STALE_UPDATE";

      vi.spyOn(api, "updateTicketStatus").mockRejectedValue(conflictError);

      render(
        <TicketWorkflowControls
          ticket={ticket}
          onStatusUpdated={vi.fn()}
          onRefreshTicket={onRefreshTicket}
        />
      );

      // Trigger transition to IN_PROGRESS
      fireEvent.click(screen.getByTestId("transition-to-in-progress"));

      // Non-crashing conflict alert banner is rendered
      expect(await screen.findByTestId("concurrency-conflict-banner")).toBeInTheDocument();
      expect(screen.getByText(/Update Conflict \(409 Conflict\)/i)).toBeInTheDocument();

      // Click "Reload Latest Changes"
      const reloadBtn = screen.getByTestId("reload-ticket-btn");
      fireEvent.click(reloadBtn);

      expect(onRefreshTicket).toHaveBeenCalled();
    });
  });

  describe("5. Integration with RequesterTicketDetail Screen", () => {
    it("renders workflow transition controls in RequesterTicketDetail for IT Staff and updates header on success", async () => {
      mockAuth(staffUser);
      const ticket = createMockTicket("OPEN");
      vi.spyOn(api, "fetchTicketDetail").mockResolvedValue(ticket);
      vi.spyOn(api, "fetchPublicComments").mockResolvedValue([]);
      vi.spyOn(api, "updateTicketStatus").mockResolvedValue({
        message: "Ticket status updated",
        ticketId: "tkt-100",
        currentStatus: "IN_PROGRESS",
      });

      render(<RequesterTicketDetail ticketId="tkt-100" onBack={vi.fn()} />);

      // Verify ticket details rendered
      expect(await screen.findByTestId("detail-ticket-number")).toHaveValue("TKT-2026-000100");

      // Verify staff workflow controls are mounted
      expect(screen.getByTestId("ticket-workflow-controls")).toBeInTheDocument();
      expect(screen.getByTestId("staff-workflow-card")).toBeInTheDocument();

      // Trigger transition
      fireEvent.click(screen.getByTestId("transition-to-in-progress"));

      await waitFor(() => {
        expect(api.updateTicketStatus).toHaveBeenCalledWith(
          "tkt-100",
          "IN_PROGRESS",
          undefined,
          "2026-10-30T00:10:00.000Z",
          undefined
        );
      });
    });

    it("displays concurrency conflict banner in RequesterTicketDetail on stale update and reloads on refresh", async () => {
      mockAuth(staffUser);
      const ticket = createMockTicket("OPEN");
      vi.spyOn(api, "fetchTicketDetail").mockResolvedValue(ticket);
      vi.spyOn(api, "fetchPublicComments").mockResolvedValue([]);

      const conflictErr: any = new Error("Stale update conflict");
      conflictErr.status = 409;
      conflictErr.code = "STALE_UPDATE";
      vi.spyOn(api, "updateTicketStatus").mockRejectedValue(conflictErr);

      render(<RequesterTicketDetail ticketId="tkt-100" onBack={vi.fn()} />);

      expect(await screen.findByTestId("detail-ticket-number")).toHaveValue("TKT-2026-000100");

      // Attempt transition to IN_PROGRESS
      fireEvent.click(screen.getByTestId("transition-to-in-progress"));

      // Safe conflict alert banner renders without crashing
      expect(await screen.findByTestId("concurrency-conflict-banner")).toBeInTheDocument();

      // Click reload latest changes
      fireEvent.click(screen.getByTestId("reload-ticket-btn"));

      await waitFor(() => {
        expect(api.fetchTicketDetail).toHaveBeenCalledTimes(2);
      });
    });
  });
});
