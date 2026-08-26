import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import App from "../../src/App";
import * as api from "../../src/api";

describe("My Tickets Screen (UI-03, AC-11, BR-10)", () => {
  const mockRequester = { id: "req-user-001", name: "Jennifer Anderson", email: "jennifer.a@example.com" };
  const mockTicket: api.Ticket = {
    id: "tkt-001",
    ticketNumber: "TKT-2026-000001",
    summary: "VPN connection error",
    description: "Cannot connect to campus VPN",
    categoryId: "cat-net-004",
    categoryName: "Network",
    relatedSystemId: "sys-003",
    relatedSystemName: "VPN",
    requestedPriority: "HIGH",
    itPriority: "HIGH",
    currentStatus: "NEW",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    attachmentCount: 0,
  };

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("toktickit_active_requester", JSON.stringify(mockRequester));
    vi.restoreAllMocks();
    vi.spyOn(api, "fetchCategories").mockResolvedValue([]);
    vi.spyOn(api, "fetchRelatedSystems").mockResolvedValue([]);
  });

  it("renders empty state when requester has no tickets (AC-11, BR-10)", async () => {
    vi.spyOn(api, "fetchMyTickets").mockResolvedValueOnce({
      data: [],
      pagination: { page: 1, limit: 10, totalItems: 0, totalPages: 1 },
    });

    render(<App />);

    expect(await screen.findByTestId("empty-tickets-state")).toBeInTheDocument();
    expect(screen.getByText(/No Tickets Submitted Yet/i)).toBeInTheDocument();
  });

  it("renders desktop table and handles search input filtering (AC-04, AC-05)", async () => {
    vi.spyOn(api, "fetchMyTickets").mockResolvedValue({
      data: [mockTicket],
      pagination: { page: 1, limit: 10, totalItems: 1, totalPages: 1 },
    });

    render(<App />);

    expect(await screen.findByTestId("desktop-table-view")).toBeInTheDocument();
    expect(screen.getAllByText("TKT-2026-000001").length).toBeGreaterThan(0);
    expect(screen.getAllByText("VPN connection error").length).toBeGreaterThan(0);
  });
});
