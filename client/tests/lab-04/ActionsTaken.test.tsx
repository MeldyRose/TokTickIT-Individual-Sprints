import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import React from "react";
import { ActionsTakenSection } from "../../src/components/ActionsTakenSection";
import { ActionTakenModal } from "../../src/components/ActionTakenModal";
import { RequesterTicketDetail } from "../../src/pages/RequesterTicketDetail";
import * as api from "../../src/api";
import * as AuthContextModule from "../../src/context/AuthContext";

describe("Actions Taken Component & Modal Tests (ActionsTaken.test.tsx)", () => {
  const staffUser: api.AuthUser = {
    id: "u_staff_alex",
    name: "Alex Thompson",
    email: "alex.thompson@toktickit.com",
    role: "IT_STAFF",
    mustChangePassword: false,
  };

  const adminUser: api.AuthUser = {
    id: "u_admin_sarah",
    name: "Sarah Jenkins",
    email: "sarah.jenkins@toktickit.com",
    role: "ADMINISTRATOR",
    mustChangePassword: false,
  };

  const requesterUser: api.AuthUser = {
    id: "u_req_jennifer",
    name: "Jennifer Anderson",
    email: "jennifer.anderson@toktickit.com",
    role: "REQUESTER",
    mustChangePassword: false,
  };

  const mockActions: api.ActionTaken[] = [
    {
      id: "act-001",
      ticketId: "tkt-100",
      actionDateTime: "2026-10-28T09:15:00.000Z",
      description: "Connected console cable to Switch-SW02 and inspected interface Gi0/24.",
      result: "Identified CRC frame errors on SFP module.",
      performedBy: {
        id: "u_staff_alex",
        name: "Alex Thompson",
        email: "alex.thompson@toktickit.com",
        role: "IT_STAFF",
      },
      followUpRequired: true,
      followUpNote: "Procure replacement 10G-SR SFP module from storage.",
      attachmentNotes: "wireshark_capture_port24.pcapng",
      createdAt: "2026-10-28T09:15:00.000Z",
      updatedAt: "2026-10-28T09:20:00.000Z",
    },
    {
      id: "act-002",
      ticketId: "tkt-100",
      actionDateTime: "2026-10-28T11:30:00.000Z",
      description: "Replaced faulty SFP module with new 10G-SR transceiver and re-seated patch cord.",
      result: "Port link up at 10 Gbps with 0 CRC errors over 15 minutes of ping testing.",
      performedBy: {
        id: "u_staff_lisa",
        name: "Lisa Martinez",
        email: "lisa.martinez@toktickit.com",
        role: "IT_STAFF",
      },
      followUpRequired: false,
      followUpNote: null,
      attachmentNotes: null,
      createdAt: "2026-10-28T11:30:00.000Z",
      updatedAt: "2026-10-28T11:30:00.000Z",
    },
  ];

  const mockTicketDetail: api.TicketDetail = {
    id: "tkt-100",
    ticketNumber: "TKT-2026-000100",
    summary: "Switch Port flapping on Floor 3",
    description: "Port Gi0/24 keeps dropping connections.",
    categoryId: "cat-net",
    category: { id: "cat-net", name: "Network" },
    relatedSystemId: "sys-01",
    relatedSystem: { id: "sys-01", name: "Switch Hardware" },
    requestedPriority: "HIGH",
    itPriority: "HIGH",
    currentStatus: "IN_PROGRESS",
    requesterId: "u_req_jennifer",
    requester: { id: "u_req_jennifer", name: "Jennifer Anderson", email: "jennifer.anderson@toktickit.com" },
    createdAt: "2026-10-28T08:00:00.000Z",
    updatedAt: "2026-10-28T11:30:00.000Z",
    attachments: [],
    ownerId: "u_staff_alex",
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(api, "fetchTicketActions").mockResolvedValue(mockActions);
    vi.spyOn(api, "fetchTicketDetail").mockResolvedValue(mockTicketDetail);
    vi.spyOn(api, "fetchPublicComments").mockResolvedValue([]);
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

  it("renders chronological list/table of Actions Taken with Zen Green tokens, performer, result, follow-up badge, and attachments (AC-01)", async () => {
    mockAuth(staffUser);

    render(<ActionsTakenSection ticketId="tkt-100" />);

    // Section title & counter
    expect(await screen.findByTestId("actions-section-title")).toBeInTheDocument();
    expect(screen.getByTestId("actions-count-badge")).toHaveTextContent("2");

    // Check chronological order of descriptions
    const rows = screen.getAllByTestId(/^action-row-/);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent("Connected console cable to Switch-SW02");
    expect(rows[1]).toHaveTextContent("Replaced faulty SFP module with new 10G-SR transceiver");

    // Performer attribution in desktop rows
    expect(within(rows[0]).getByText("Alex Thompson")).toBeInTheDocument();
    expect(within(rows[1]).getByText("Lisa Martinez")).toBeInTheDocument();

    // Result callout with Zen Green accent
    const resultCallout = screen.getByTestId("action-result-act-001");
    expect(resultCallout).toBeInTheDocument();
    expect(resultCallout).toHaveTextContent("Identified CRC frame errors on SFP module.");
    expect(resultCallout).toHaveStyle({
      backgroundColor: "rgb(245, 247, 246)",
      borderLeft: "3px solid rgb(0, 107, 60)",
    });

    // Follow-up badges
    const followUpBadge1 = screen.getByTestId("action-followup-badge-act-001");
    expect(followUpBadge1).toHaveTextContent("⚠️ Follow-up Required");
    expect(followUpBadge1).toHaveStyle({ backgroundColor: "rgb(237, 108, 2)" });

    const followUpNote1 = screen.getByTestId("action-followup-note-act-001");
    expect(followUpNote1).toHaveTextContent("Procure replacement 10G-SR SFP module from storage.");
    expect(followUpNote1).toHaveStyle({
      backgroundColor: "rgb(255, 248, 225)",
      borderLeft: "3px solid rgb(237, 108, 2)",
    });

    const followUpBadge2 = screen.getByTestId("action-followup-badge-act-002");
    expect(followUpBadge2).toHaveTextContent("✓ No Follow-up");

    // Attachment notes reference
    expect(screen.getByTestId("action-attachment-act-001")).toHaveTextContent(
      "📎 Attachment Notes: wireshark_capture_port24.pcapng"
    );
  });

  it("dynamically toggles validation and display of Follow-up Note when Follow-Up Required toggle is checked (AC-02)", async () => {
    mockAuth(staffUser);

    render(
      <ActionTakenModal
        isOpen={true}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
        ticketId="tkt-100"
      />
    );

    // Initial state: follow-up note field should not be in document
    expect(screen.queryByTestId("follow-up-note-input")).toBeNull();

    // Fill valid description and result
    fireEvent.change(screen.getByTestId("action-description-input"), {
      target: { value: "Performed network trace and captured packet drops." },
    });
    fireEvent.change(screen.getByTestId("action-result-input"), {
      target: { value: "Observed severe frame loss on port 24." },
    });

    // Toggle Follow-Up Required to TRUE
    const toggle = screen.getByTestId("follow-up-toggle");
    fireEvent.click(toggle);

    // Follow-up note field should now appear dynamically
    const noteInput = await screen.findByTestId("follow-up-note-input");
    expect(noteInput).toBeInTheDocument();

    // Attempt submit with empty follow-up note -> validation error
    fireEvent.click(screen.getByTestId("modal-submit-btn"));

    const noteError = await screen.findByTestId("follow-up-note-error");
    expect(noteError).toBeInTheDocument();
    expect(noteError).toHaveTextContent(/follow-up note is required/i);

    // Provide note less than 5 characters -> error persists
    fireEvent.change(noteInput, { target: { value: "Fix" } });
    fireEvent.click(screen.getByTestId("modal-submit-btn"));
    expect(await screen.findByTestId("follow-up-note-error")).toHaveTextContent(/at least 5 characters/i);

    // Provide valid note (>= 5 chars) -> error disappears
    fireEvent.change(noteInput, { target: { value: "Order replacement SFP transceiver." } });
    expect(screen.queryByTestId("follow-up-note-error")).toBeNull();

    // Toggle Follow-Up Required back to FALSE -> note field disappears
    fireEvent.click(toggle);
    expect(screen.queryByTestId("follow-up-note-input")).toBeNull();
  });

  it("enforces validation feedback on description (min 10 chars) and result (min 3 chars)", async () => {
    mockAuth(staffUser);

    render(
      <ActionTakenModal
        isOpen={true}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
        ticketId="tkt-100"
      />
    );

    // Submit empty form
    fireEvent.click(screen.getByTestId("modal-submit-btn"));

    expect(await screen.findByTestId("action-description-error")).toHaveTextContent(/10 characters/i);
    expect(await screen.findByTestId("action-result-error")).toHaveTextContent(/3 characters/i);

    // Enter short description
    fireEvent.change(screen.getByTestId("action-description-input"), { target: { value: "Short" } });
    fireEvent.click(screen.getByTestId("modal-submit-btn"));
    expect(await screen.findByTestId("action-description-error")).toHaveTextContent(/at least 10 characters/i);

    // Enter short result
    fireEvent.change(screen.getByTestId("action-result-input"), { target: { value: "ok" } });
    fireEvent.click(screen.getByTestId("modal-submit-btn"));
    expect(await screen.findByTestId("action-result-error")).toHaveTextContent(/at least 3 characters/i);
  });

  it("renders Actions Taken in read-only mode for REQUESTER with no create or edit buttons in DOM (AC-06)", async () => {
    mockAuth(requesterUser);

    render(<ActionsTakenSection ticketId="tkt-100" />);

    // Actions list is visible
    expect(await screen.findByTestId("actions-section-title")).toBeInTheDocument();
    expect(screen.getByTestId("actions-count-badge")).toHaveTextContent("2");
    expect(screen.getAllByText("Connected console cable to Switch-SW02 and inspected interface Gi0/24.")[0]).toBeInTheDocument();

    // Assert write controls do NOT exist anywhere in the DOM
    expect(screen.queryByTestId("log-action-btn")).toBeNull();
    expect(screen.queryByTestId("edit-action-btn-act-001")).toBeNull();
    expect(screen.queryByTestId("edit-action-btn-act-002")).toBeNull();
    expect(screen.queryByTestId("mobile-edit-action-btn-act-001")).toBeNull();
    expect(screen.queryByTestId("mobile-edit-action-btn-act-002")).toBeNull();
    expect(screen.queryByText(/\+ Log Action Taken/i)).toBeNull();
    expect(screen.queryByText(/✏️ Edit/i)).toBeNull();
  });

  it("renders create and edit controls for IT_STAFF and ADMINISTRATOR roles", async () => {
    mockAuth(staffUser);

    render(<ActionsTakenSection ticketId="tkt-100" />);

    // IT Staff sees + Log Action Taken button
    const logBtn = await screen.findByTestId("log-action-btn");
    expect(logBtn).toBeInTheDocument();

    // IT Staff sees Edit buttons on action rows
    expect(screen.getByTestId("edit-action-btn-act-001")).toBeInTheDocument();
    expect(screen.getByTestId("edit-action-btn-act-002")).toBeInTheDocument();

    // Clicking + Log Action Taken opens modal
    fireEvent.click(logBtn);
    expect(await screen.findByTestId("action-taken-modal")).toBeInTheDocument();
    expect(screen.getByTestId("modal-title")).toHaveTextContent(/Log Action Taken/i);
    expect(screen.getByTestId("performer-name")).toHaveTextContent("Alex Thompson");

    // Close modal
    fireEvent.click(screen.getByTestId("modal-close-btn"));
    await waitFor(() => {
      expect(screen.queryByTestId("action-taken-modal")).toBeNull();
    });

    // Clicking Edit opens modal prefilled
    fireEvent.click(screen.getByTestId("edit-action-btn-act-001"));
    expect(await screen.findByTestId("action-taken-modal")).toBeInTheDocument();
    expect(screen.getByTestId("modal-title")).toHaveTextContent(/Edit Action Taken/i);
    expect(screen.getByTestId("action-description-input")).toHaveValue(
      "Connected console cable to Switch-SW02 and inspected interface Gi0/24."
    );
  });

  it("supports creating a new action taken via modal and calls createTicketAction API", async () => {
    mockAuth(staffUser);

    const createdAction: api.ActionTaken = {
      id: "act-003",
      ticketId: "tkt-100",
      actionDateTime: "2026-10-28T12:00:00.000Z",
      description: "Tested bandwidth throughput using iperf3 tool.",
      result: "Throughput verified at 9.8 Gbps consistently.",
      performedBy: {
        id: "u_staff_alex",
        name: "Alex Thompson",
        role: "IT_STAFF",
      },
      followUpRequired: false,
      followUpNote: null,
      attachmentNotes: "iperf3_results.log",
      createdAt: "2026-10-28T12:00:00.000Z",
      updatedAt: "2026-10-28T12:00:00.000Z",
    };

    const createSpy = vi.spyOn(api, "createTicketAction").mockResolvedValue({ action: createdAction });

    render(<ActionsTakenSection ticketId="tkt-100" />);

    // Open modal
    const logBtn = await screen.findByTestId("log-action-btn");
    fireEvent.click(logBtn);

    // Fill form
    fireEvent.change(screen.getByTestId("action-description-input"), {
      target: { value: "Tested bandwidth throughput using iperf3 tool." },
    });
    fireEvent.change(screen.getByTestId("action-result-input"), {
      target: { value: "Throughput verified at 9.8 Gbps consistently." },
    });
    fireEvent.change(screen.getByTestId("attachment-notes-input"), {
      target: { value: "iperf3_results.log" },
    });

    // Submit
    fireEvent.click(screen.getByTestId("modal-submit-btn"));

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith(
        "tkt-100",
        expect.objectContaining({
          description: "Tested bandwidth throughput using iperf3 tool.",
          result: "Throughput verified at 9.8 Gbps consistently.",
          followUpRequired: false,
          attachmentNotes: "iperf3_results.log",
        })
      );
    });

    // Verify modal closes and new action is rendered in list
    await waitFor(() => {
      expect(screen.queryByTestId("action-taken-modal")).toBeNull();
    });
    expect(screen.getAllByText("Tested bandwidth throughput using iperf3 tool.")[0]).toBeInTheDocument();
    expect(screen.getByTestId("actions-count-badge")).toHaveTextContent("3");
  });

  it("supports editing an existing action taken with optimistic concurrency control and error alert on 409 Conflict", async () => {
    mockAuth(staffUser);

    const conflictErr = new Error("Stale update conflict");
    (conflictErr as any).status = 409;
    (conflictErr as any).code = "STALE_UPDATE";

    const updateSpy = vi.spyOn(api, "updateTicketAction").mockRejectedValue(conflictErr);

    render(
      <ActionTakenModal
        isOpen={true}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
        ticketId="tkt-100"
        actionToEdit={mockActions[0]}
      />
    );

    // Modify description
    fireEvent.change(screen.getByTestId("action-description-input"), {
      target: { value: "Updated description for optical transceiver testing." },
    });

    // Submit
    fireEvent.click(screen.getByTestId("modal-submit-btn"));

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith(
        "tkt-100",
        "act-001",
        expect.objectContaining({
          expectedUpdatedAt: "2026-10-28T09:20:00.000Z",
        })
      );
    });

    // Verify 409 conflict alert appears in modal
    const errorAlert = await screen.findByTestId("modal-error-alert");
    expect(errorAlert).toBeInTheDocument();
    expect(errorAlert).toHaveTextContent(/modified by another user/i);
  });

  it("renders responsive desktop table container (>=992px) and mobile stacked card container (<768px)", async () => {
    mockAuth(staffUser);

    render(<ActionsTakenSection ticketId="tkt-100" />);

    // Desktop table container should have class 'd-none d-lg-block'
    const desktopContainer = await screen.findByTestId("actions-desktop-table-container");
    expect(desktopContainer).toHaveClass("d-none", "d-lg-block");

    // Mobile cards container should have class 'd-lg-none'
    const mobileContainer = screen.getByTestId("actions-mobile-cards-container");
    expect(mobileContainer).toHaveClass("d-lg-none");

    // Both containers render the action entries
    expect(screen.getByTestId("action-row-act-001")).toBeInTheDocument();
    expect(screen.getByTestId("action-card-act-001")).toBeInTheDocument();
  });

  it("verifies Requester Ticket Detail screen includes Actions Taken in read-only mode without write controls", async () => {
    mockAuth(requesterUser);

    render(<RequesterTicketDetail ticketId="tkt-100" onBack={vi.fn()} />);

    // Detail screen loads and renders Actions Taken section
    expect(await screen.findByTestId("actions-taken-section")).toBeInTheDocument();
    expect(screen.getAllByText("Connected console cable to Switch-SW02 and inspected interface Gi0/24.")[0]).toBeInTheDocument();

    // Confirm write buttons are completely absent
    expect(screen.queryByTestId("log-action-btn")).toBeNull();
    expect(screen.queryByTestId("edit-action-btn-act-001")).toBeNull();
  });
});
