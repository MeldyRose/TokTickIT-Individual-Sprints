import { jsx as _jsx } from "react/jsx-runtime";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import App from "../../src/App";
import * as api from "../../src/api";
describe("Ticket Detail View (Issue 5)", () => {
    const mockRequester = { id: "req-user-001", name: "Jennifer Anderson", email: "jennifer.a@example.com" };
    const mockDetail = {
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
        currentStatus: "NEW",
        requesterId: "req-user-001",
        requester: { id: "req-user-001", name: "Jennifer Anderson", email: "jennifer.a@example.com" },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        attachments: [],
    };
    beforeEach(() => {
        localStorage.clear();
        localStorage.setItem("toktickit_active_requester", JSON.stringify(mockRequester));
        vi.restoreAllMocks();
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
                    currentStatus: "NEW",
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    attachmentCount: 0,
                },
            ],
            pagination: { page: 1, limit: 10, totalItems: 1, totalPages: 1 },
        });
    });
    it("navigates to detail view and renders read-only ticket fields (FR-06, BR-11)", async () => {
        vi.spyOn(api, "fetchTicketDetail").mockResolvedValueOnce(mockDetail);
        render(_jsx(App, {}));
        // Click ticket link
        const ticketLink = await screen.findByTestId("ticket-link-tkt-001");
        fireEvent.click(ticketLink);
        // Verify detail fields
        expect(await screen.findByTestId("detail-ticket-number")).toHaveValue("TKT-2026-000001");
        expect(screen.getByTestId("detail-summary")).toHaveValue("VPN connection error");
        expect(screen.getByText("Cannot connect to campus VPN network.")).toBeInTheDocument();
        expect(screen.getAllByText(/Public Comments/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/Resolution Summary/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/Event Log/i).length).toBeGreaterThan(0);
    });
    it("handles adding and posting a public comment", async () => {
        vi.spyOn(api, "fetchTicketDetail").mockResolvedValueOnce(mockDetail);
        render(_jsx(App, {}));
        const ticketLink = await screen.findByTestId("ticket-link-tkt-001");
        fireEvent.click(ticketLink);
        const input = await screen.findByTestId("add-comment-input");
        fireEvent.change(input, { target: { value: "I tried restarting the VPN client but it still failed." } });
        const postBtn = screen.getByTestId("post-comment-btn");
        fireEvent.click(postBtn);
        expect(screen.getByText("I tried restarting the VPN client but it still failed.")).toBeInTheDocument();
    });
    it("displays Access Denied when API returns 403 or 404 (FR-07, BR-05)", async () => {
        vi.spyOn(api, "fetchTicketDetail").mockRejectedValueOnce(new Error("Ticket not found or access denied"));
        render(_jsx(App, {}));
        const ticketLink = await screen.findByTestId("ticket-link-tkt-001");
        fireEvent.click(ticketLink);
        expect(await screen.findByTestId("detail-access-denied")).toBeInTheDocument();
        expect(screen.getByText(/Access Denied or Ticket Not Found/i)).toBeInTheDocument();
    });
});
