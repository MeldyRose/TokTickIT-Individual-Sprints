import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { StaffTicketQueue } from "../../src/pages/StaffTicketQueue";
import * as api from "../../src/api";

describe("IT Staff Ticket Queue Component Tests (UI-03, AC-05, AC-18)", () => {
  const mockTicketsResponse: api.TicketListResponse = {
    data: [
      {
        id: "tkt-001",
        ticketNumber: "TKT-2026-000001",
        summary: "Laptop screen flickering",
        description: "Screen flashes intermittently",
        categoryId: "cat-hw",
        categoryName: "Hardware",
        relatedSystemId: "sys-01",
        relatedSystemName: "Laptop",
        requestedPriority: "HIGH",
        itPriority: "HIGH",
        currentStatus: "NEW",
        createdAt: "2026-09-15T10:00:00.000Z",
        updatedAt: "2026-09-15T10:00:00.000Z",
        attachmentCount: 1,
        requester: { id: "req-1", name: "Jennifer Anderson", email: "jennifer@example.com" },
        owner: null,
      },
      {
        id: "tkt-002",
        ticketNumber: "TKT-2026-000002",
        summary: "VPN authentication error",
        description: "Cannot connect remotely",
        categoryId: "cat-net",
        categoryName: "Network",
        relatedSystemId: "sys-02",
        relatedSystemName: "VPN",
        requestedPriority: "MEDIUM",
        itPriority: "URGENT",
        currentStatus: "IN_PROGRESS",
        createdAt: "2026-09-16T11:00:00.000Z",
        updatedAt: "2026-09-16T11:30:00.000Z",
        attachmentCount: 0,
        requester: { id: "req-2", name: "David Lee", email: "david@example.com" },
        owner: { id: "staff-1", name: "Alex Thompson", email: "alex@example.com" },
      },
    ],
    pagination: {
      page: 1,
      limit: 10,
      totalItems: 2,
      totalPages: 1,
    },
  };

  const mockCategories: api.Category[] = [
    { id: "cat-hw", name: "Hardware" },
    { id: "cat-net", name: "Network" },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(api, "fetchCategories").mockResolvedValue(mockCategories);
    vi.spyOn(api, "fetchTickets").mockResolvedValue(mockTicketsResponse);
  });

  it("renders top control bar with search input, filters, sort, and clear filters button (UI-03)", async () => {
    render(<StaffTicketQueue onSelectTicket={() => {}} />);

    expect(await screen.findByTestId("queue-search-input")).toBeInTheDocument();
    expect(screen.getByTestId("queue-category-select")).toBeInTheDocument();
    expect(screen.getByTestId("queue-status-select")).toBeInTheDocument();
    expect(screen.getByTestId("queue-priority-select")).toBeInTheDocument();
    expect(screen.getByTestId("queue-owner-select")).toBeInTheDocument();
    expect(screen.getByTestId("queue-sort-select")).toBeInTheDocument();
    expect(screen.getByTestId("queue-clear-filters-btn")).toBeInTheDocument();
  });

  it("renders desktop table view with ticket details (UI-03)", async () => {
    render(<StaffTicketQueue onSelectTicket={() => {}} />);

    const tkt1Elements = await screen.findAllByText("TKT-2026-000001");
    expect(tkt1Elements.length).toBeGreaterThan(0);
    const summary1Elements = screen.getAllByText("Laptop screen flickering");
    expect(summary1Elements.length).toBeGreaterThan(0);
    const tkt2Elements = screen.getAllByText("TKT-2026-000002");
    expect(tkt2Elements.length).toBeGreaterThan(0);
    const summary2Elements = screen.getAllByText("VPN authentication error");
    expect(summary2Elements.length).toBeGreaterThan(0);
  });

  it("handles search input debounce and triggers API search (UI-03)", async () => {
    const fetchSpy = vi.spyOn(api, "fetchTickets").mockResolvedValue({
      data: [mockTicketsResponse.data[0]],
      pagination: { page: 1, limit: 10, totalItems: 1, totalPages: 1 },
    });

    render(<StaffTicketQueue onSelectTicket={() => {}} />);

    const searchInput = await screen.findByTestId("queue-search-input");
    fireEvent.change(searchInput, { target: { value: "Laptop" } });

    await waitFor(
      () => {
        expect(fetchSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            search: "Laptop",
          })
        );
      },
      { timeout: 1000 }
    );
  });

  it("resets all filters when clicking Clear Filters button (UI-03)", async () => {
    render(<StaffTicketQueue onSelectTicket={() => {}} />);

    const searchInput = (await screen.findByTestId("queue-search-input")) as HTMLInputElement;
    fireEvent.change(searchInput, { target: { value: "Search term" } });

    const clearBtn = screen.getByTestId("queue-clear-filters-btn");
    fireEvent.click(clearBtn);

    expect(searchInput.value).toBe("");
  });

  it("displays clear feedback message when search returns no results (UI-03, AC-05)", async () => {
    vi.spyOn(api, "fetchTickets").mockResolvedValue({
      data: [],
      pagination: { page: 1, limit: 10, totalItems: 0, totalPages: 1 },
    });

    render(<StaffTicketQueue onSelectTicket={() => {}} />);

    expect(await screen.findByTestId("no-results-message")).toBeInTheDocument();
    expect(screen.getByTestId("queue-clear-filters-btn")).toBeInTheDocument();
  });
});
