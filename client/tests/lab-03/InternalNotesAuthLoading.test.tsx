import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { InternalNotesSection } from "../../src/components/InternalNotesSection";
import * as api from "../../src/api";
import * as authCtx from "../../src/context/AuthContext";

describe("InternalNotesSection Auth Loading and Dynamic Transition Test", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(api, "fetchInternalNotes").mockResolvedValue([
      {
        id: "n-1",
        ticketId: "tkt-001",
        content: "Operational note",
        author: { id: "staff-1", name: "Alex Staff", role: "IT_STAFF" },
        createdAt: new Date().toISOString(),
      },
    ]);
  });

  it("handles transition from user: null (auth loading) to user: IT_STAFF without hook order errors", async () => {
    const useAuthSpy = vi.spyOn(authCtx, "useAuth");
    useAuthSpy.mockReturnValue({ user: null } as any);

    const { rerender } = render(<InternalNotesSection ticketId="tkt-001" />);
    expect(screen.queryByTestId("internal-notes-section")).toBeNull();
    expect(api.fetchInternalNotes).not.toHaveBeenCalled();

    useAuthSpy.mockReturnValue({
      user: {
        id: "staff-1",
        name: "Alex Staff",
        email: "alex@toktickit.com",
        role: "IT_STAFF",
        mustChangePassword: false,
      },
    } as any);

    rerender(<InternalNotesSection ticketId="tkt-001" />);

    await waitFor(() => {
      expect(screen.getByTestId("internal-notes-section")).toBeTruthy();
      expect(api.fetchInternalNotes).toHaveBeenCalledWith("tkt-001");
    });
  });
});
