import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "../../src/App";
import * as api from "../../src/api";

describe("Development Requester Removal (Issue 16, AC-03, BR-22)", () => {
  const mockUser: api.AuthUser = {
    id: "u_req_1",
    name: "Jennifer Anderson",
    email: "jennifer@toktickit.com",
    role: "REQUESTER",
    mustChangePassword: false,
  };

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    vi.spyOn(api, "getCurrentUser").mockResolvedValue(mockUser);
    vi.spyOn(api, "fetchCategories").mockResolvedValue([]);
    vi.spyOn(api, "fetchRelatedSystems").mockResolvedValue([]);
    vi.spyOn(api, "fetchMyTickets").mockResolvedValue({
      data: [],
      pagination: { page: 1, limit: 10, totalItems: 0, totalPages: 1 },
    });
  });

  it("verifies Development Requester selector is removed and session identity is used (AC-03, BR-22)", async () => {
    render(<App />);

    // Development requester selector screen and change-requester buttons must NOT exist
    expect(screen.queryByTestId("selection-title")).toBeNull();
    expect(screen.queryByTestId("requester-select-dropdown")).toBeNull();
    expect(screen.queryByTestId("change-requester-btn")).toBeNull();

    // Authenticated user widget is rendered instead
    expect(await screen.findByTestId("authenticated-user-widget")).toBeInTheDocument();
    expect(screen.getByTestId("user-name-display")).toHaveTextContent("Jennifer Anderson");
  });
});
