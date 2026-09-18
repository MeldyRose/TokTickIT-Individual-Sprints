import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { InternalNotesSection } from "../../src/components/InternalNotesSection";
import * as api from "../../src/api";
import * as AuthContextModule from "../../src/context/AuthContext";

describe("Staff Ticket Detail & Internal Notes Section UI Tests (StaffTicketDetail.test.tsx - Issue 19, AC-11, AC-04)", () => {
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

  const mockNotes: api.InternalNote[] = [
    {
      id: "note-1",
      ticketId: "tkt-001",
      content: "Initial hardware diagnostic note",
      author: { id: "u_staff_1", name: "Alex Thompson", role: "IT_STAFF" },
      createdAt: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(api, "fetchInternalNotes").mockResolvedValue(mockNotes);
    vi.spyOn(api, "postInternalNote").mockResolvedValue({
      id: "note-2",
      ticketId: "tkt-001",
      content: "New internal note created in test",
      author: { id: "u_staff_1", name: "Alex Thompson", role: "IT_STAFF" },
      createdAt: new Date().toISOString(),
    });
  });

  const renderWithAuthUser = (user: api.AuthUser | null) => {
    vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
      user,
      isAuthenticated: !!user,
      isLoading: false,
      login: async () => ({} as api.AuthUser),
      logout: async () => {},
      changePassword: async () => {},
      refreshUser: async () => {},
    });
    return render(<InternalNotesSection ticketId="tkt-001" />);
  };

  it("renders InternalNotesSection with light amber background (#FFFDE7), amber border (#FFE082), and lock indicator for IT Staff (AC-11)", async () => {
    renderWithAuthUser(staffUser);

    await waitFor(() => {
      const section = screen.getByTestId("internal-notes-section");
      expect(section).toBeInTheDocument();
      expect(section).toHaveStyle({ backgroundColor: "rgb(255, 253, 231)" }); // #FFFDE7
    });

    expect(screen.getByText(/Internal Notes \(IT Staff & Admin Only\)/i)).toBeInTheDocument();
    expect(screen.getByTestId("internal-notes-lock-badge")).toBeInTheDocument();
    expect(screen.getByText("Initial hardware diagnostic note")).toBeInTheDocument();
  });

  it("renders InternalNotesSection for Administrator role (AC-11)", async () => {
    renderWithAuthUser(adminUser);

    await waitFor(() => {
      expect(screen.getByTestId("internal-notes-section")).toBeInTheDocument();
    });
  });

  it("completely excludes InternalNotesSection from DOM for Requester role (AC-04, BR-04)", () => {
    renderWithAuthUser(requesterUser);

    expect(screen.queryByTestId("internal-notes-section")).not.toBeInTheDocument();
    expect(screen.queryByText(/Internal Notes/i)).not.toBeInTheDocument();
  });

  it("handles adding a new internal note via the form (BR-16)", async () => {
    renderWithAuthUser(staffUser);

    await waitFor(() => {
      expect(screen.getByTestId("add-note-input")).toBeInTheDocument();
    });

    const textarea = screen.getByTestId("add-note-input");
    const submitBtn = screen.getByTestId("post-note-btn");

    fireEvent.change(textarea, { target: { value: "New internal note created in test" } });
    expect(submitBtn).not.toBeDisabled();

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.postInternalNote).toHaveBeenCalledWith("tkt-001", "New internal note created in test");
      expect(screen.getByText("New internal note created in test")).toBeInTheDocument();
    });
  });
});
