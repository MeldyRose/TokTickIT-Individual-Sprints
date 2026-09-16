import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import App from "../../src/App";
import * as api from "../../src/api";

describe("Requester Ticket Detail & Collaboration (Issue 16)", () => {
  const mockUser: api.AuthUser = {
    id: "u_req_1",
    name: "Jennifer Anderson",
    email: "jennifer@toktickit.com",
    role: "REQUESTER",
    mustChangePassword: false,
  };

  const mockDetail: api.TicketDetail = {
    id: "tkt-001",
    ticketNumber: "TKT-2026-000001",
    summary: "VPN connection error",
    description: "Cannot connect to campus VPN network.",
    categoryId: "cat-net-004",
    category: { id: "cat-net-004", name: "Network" },
    relatedSystemId: "sys-003",
    relatedSystem: { id: "sys-003", name: "VPN" },
    requestedPriority: "HIGH",
    itPriority: "HIGH",
    currentStatus: "IN_PROGRESS",
    requesterId: "u_req_1",
    requester: { id: "u_req_1", name: "Jennifer Anderson", email: "jennifer@toktickit.com" },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    attachments: [],
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(api, "getCurrentUser").mockResolvedValue(mockUser);
    vi.spyOn(api, "fetchCategories").mockResolvedValue([]);
    vi.spyOn(api, "fetchRelatedSystems").mockResolvedValue([]);
    vi.spyOn(api, "fetchMyTickets").mockResolvedValue({
      data: [
        {
          id: "tkt-001",
          ticketNumber: "TKT-2026-000001",
          summary: "VPN connection error",
          categoryId: "cat-net-004",
          categoryName: "Network",
          relatedSystemId: "sys-003",
          relatedSystemName: "VPN",
          requestedPriority: "HIGH",
          itPriority: "HIGH",
          currentStatus: "IN_PROGRESS",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          attachmentCount: 0,
        },
      ],
      pagination: { page: 1, limit: 10, totalItems: 1, totalPages: 1 },
    });
  });

  it("renders detail view and excludes Internal Notes section completely from DOM (AC-04)", async () => {
    vi.spyOn(api, "fetchTicketDetail").mockResolvedValueOnce(mockDetail);
    vi.spyOn(api, "fetchPublicComments").mockResolvedValueOnce([]);

    render(<App />);

    // Click ticket link
    const ticketLink = await screen.findByTestId("ticket-link-tkt-001");
    fireEvent.click(ticketLink);

    // Verify detail rendered
    expect(await screen.findByTestId("detail-ticket-number")).toHaveValue("TKT-2026-000001");
    expect(screen.getByTestId("public-comments-section")).toBeInTheDocument();

    // Assert Internal Notes elements do NOT exist in DOM for Requester
    expect(screen.queryByText(/Internal Notes/i)).toBeNull();
    expect(screen.queryByText(/IT Staff & Admin Only/i)).toBeNull();
  });

  it("allows posting public comment and viewing public comment thread (AC-10)", async () => {
    vi.spyOn(api, "fetchTicketDetail").mockResolvedValueOnce(mockDetail);
    vi.spyOn(api, "fetchPublicComments").mockResolvedValueOnce([]);
    vi.spyOn(api, "postPublicComment").mockResolvedValueOnce({
      id: "c-101",
      content: "Thank you for looking into this.",
      author: { id: "u_req_1", name: "Jennifer Anderson", role: "REQUESTER" },
      createdAt: new Date().toISOString(),
    });

    render(<App />);

    const ticketLink = await screen.findByTestId("ticket-link-tkt-001");
    fireEvent.click(ticketLink);

    const input = await screen.findByTestId("add-comment-input");
    fireEvent.change(input, { target: { value: "Thank you for looking into this." } });

    const postBtn = screen.getByTestId("post-comment-btn");
    fireEvent.click(postBtn);

    expect(await screen.findByText("Thank you for looking into this.")).toBeInTheDocument();
  });

  it("renders Problem Appears Resolved action button on active ticket and updates status to WAITING_FOR_REQUESTER (AC-09, BR-05)", async () => {
    vi.spyOn(api, "fetchTicketDetail").mockResolvedValueOnce(mockDetail);
    vi.spyOn(api, "fetchPublicComments").mockResolvedValueOnce([]);
    vi.spyOn(api, "updateRequesterTicketStatus").mockResolvedValueOnce({
      message: "Ticket status updated",
      ticketId: "tkt-001",
      currentStatus: "WAITING_FOR_REQUESTER",
    });

    render(<App />);

    const ticketLink = await screen.findByTestId("ticket-link-tkt-001");
    fireEvent.click(ticketLink);

    // Find and click Problem Appears Resolved button
    const resolveBtn = await screen.findByTestId("problem-resolved-btn");
    fireEvent.click(resolveBtn);

    // Modal opens
    const confirmBtn = await screen.findByTestId("confirm-resolved-btn");
    fireEvent.click(confirmBtn);

    expect(api.updateRequesterTicketStatus).toHaveBeenCalledWith(
      "tkt-001",
      "WAITING_FOR_REQUESTER",
      expect.any(String)
    );
  });
});
