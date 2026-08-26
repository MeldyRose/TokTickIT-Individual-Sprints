import { describe, it, expect } from "vitest";
import { generateTicketNumber } from "../../src/utils/ticketNumber.js";

describe("Ticket Number Generator (UNIT-01)", () => {
  it("generates ticket number matching required TKT-YYYY-XXXXXX format", () => {
    const ticketNumber = generateTicketNumber();
    const currentYear = new Date().getFullYear();
    const pattern = new RegExp(`^TKT-${currentYear}-\\d{6}$`);

    expect(ticketNumber).toMatch(pattern);
  });
});
