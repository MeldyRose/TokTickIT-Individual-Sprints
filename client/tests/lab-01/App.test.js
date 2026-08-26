import { jsx as _jsx } from "react/jsx-runtime";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import App from "../../src/App";
import * as api from "../../src/api";
describe("App", () => {
    beforeEach(() => {
        localStorage.clear();
        localStorage.setItem("toktickit_active_requester", JSON.stringify({ id: "req-user-001", name: "Jennifer Anderson", email: "jennifer.a@example.com" }));
        vi.spyOn(api, "fetchMyTickets").mockResolvedValue({
            data: [],
            pagination: { page: 1, limit: 10, totalItems: 0, totalPages: 1 },
        });
    });
    it("renders the TokTickIT heading", () => {
        render(_jsx(App, {}));
        expect(screen.getAllByText(/TokTickIT/i).length).toBeGreaterThan(0);
    });
    it("shows Online and the seeded categories on success", async () => {
        const mockCategories = [
            { id: "cat-acc-001", name: "Account and Access" },
            { id: "cat-hwd-002", name: "Hardware" },
            { id: "cat-sfw-003", name: "Software" },
            { id: "cat-net-004", name: "Network" },
        ];
        vi.spyOn(api, "checkSystem").mockResolvedValueOnce({
            online: true,
            categories: mockCategories,
        });
        render(_jsx(App, {}));
        const button = screen.getByRole("button", { name: /Check System/i });
        fireEvent.click(button);
        expect(await screen.findByText(/Online/i)).toBeInTheDocument();
        expect(screen.getByText("Supported Request Categories:")).toBeInTheDocument();
        expect(screen.getByText("Account and Access")).toBeInTheDocument();
        expect(screen.getByText("Hardware")).toBeInTheDocument();
        expect(screen.getByText("Software")).toBeInTheDocument();
        expect(screen.getByText("Network")).toBeInTheDocument();
    });
    it("shows an Offline error message when the API is unavailable", async () => {
        vi.spyOn(api, "checkSystem").mockRejectedValueOnce(new Error("Unable to connect to TokTickIT API"));
        render(_jsx(App, {}));
        const button = screen.getByRole("button", { name: /Check System/i });
        fireEvent.click(button);
        expect(await screen.findByText(/Offline/i)).toBeInTheDocument();
        expect(screen.getByText("Unable to connect to TokTickIT API")).toBeInTheDocument();
    });
});
