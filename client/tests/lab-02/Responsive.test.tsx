import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "../../src/App";
import * as api from "../../src/api";

describe("Responsive Viewport Shift (RESP-01, AC-12)", () => {
  const mockRequester = { id: "req-user-001", name: "Jennifer Anderson", email: "jennifer.a@example.com" };
  const mockTicket: api.Ticket = {
    id: "tkt-001",
    ticketNumber: "TKT-2026-999999",
    summary: "Responsive Card Test Ticket",
    description: "Testing responsive layout",
    categoryId: "cat-hwd-002",
    categoryName: "Hardware",
    relatedSystemId: "sys-007",
    relatedSystemName: "Corporate Laptop",
    requestedPriority: "MEDIUM",
    itPriority: "MEDIUM",
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
    vi.spyOn(api, "fetchMyTickets").mockResolvedValue({
      data: [mockTicket],
      pagination: { page: 1, limit: 10, totalItems: 1, totalPages: 1 },
    });
  });

  it("renders both desktop table container and mobile cards view container", async () => {
    render(<App />);

    expect(await screen.findByTestId("desktop-table-view")).toBeInTheDocument();
    expect(screen.getByTestId("mobile-cards-view")).toBeInTheDocument();
    expect(screen.getAllByText("Responsive Card Test Ticket").length).toBeGreaterThan(0);
  });
});
