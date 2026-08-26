import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import App from "../../src/App";
import * as api from "../../src/api";

describe("Create Ticket Screen (UI-01, AC-09, BR-06)", () => {
  const mockCategories = [{ id: "cat-hwd-002", name: "Hardware" }];
  const mockSystems = [{ id: "sys-007", name: "Corporate Laptop" }];
  const mockRequester = { id: "req-user-001", name: "Jennifer Anderson", email: "jennifer.a@example.com" };

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("toktickit_active_requester", JSON.stringify(mockRequester));
    vi.restoreAllMocks();
    vi.spyOn(api, "fetchCategories").mockResolvedValue(mockCategories);
    vi.spyOn(api, "fetchRelatedSystems").mockResolvedValue(mockSystems);
    vi.spyOn(api, "fetchMyTickets").mockResolvedValue({
      data: [],
      pagination: { page: 1, limit: 10, totalItems: 0, totalPages: 1 },
    });
  });

  it("displays validation error when required Summary is empty (UI-01, AC-09)", async () => {
    render(<App />);

    // Navigate to Create Ticket screen
    const navBtn = await screen.findByTestId("nav-create-ticket");
    fireEvent.click(navBtn);

    const submitBtn = await screen.findByTestId("submit-ticket-btn");
    fireEvent.click(submitBtn);

    // Summary error message should appear
    expect(await screen.findByTestId("summary-error")).toHaveTextContent(/Summary is required/i);
  });

  it("submits form and displays official Ticket Number on success (AC-01, BR-01)", async () => {
    const mockCreatedTicket: api.Ticket = {
      id: "tkt-001",
      ticketNumber: "TKT-2026-123456",
      summary: "Laptop battery issue",
      description: "Drains quickly",
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

    const createSpy = vi.spyOn(api, "createTicket").mockResolvedValueOnce(mockCreatedTicket);

    render(<App />);

    // Navigate to Create Ticket screen
    const navBtn = await screen.findByTestId("nav-create-ticket");
    fireEvent.click(navBtn);

    const summaryInput = await screen.findByTestId("summary-input");
    fireEvent.change(summaryInput, { target: { value: "Laptop battery issue" } });

    const submitBtn = screen.getByTestId("submit-ticket-btn");
    fireEvent.click(submitBtn);

    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({ summary: "Laptop battery issue" }),
      "req-user-001"
    );

    expect(await screen.findByTestId("official-ticket-number")).toHaveTextContent("TKT-2026-123456");
  });
});
