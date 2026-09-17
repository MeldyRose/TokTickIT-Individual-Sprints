import { describe, it, expect } from "vitest";
import { TicketStatus } from "@prisma/client";
import { isValidStatusTransition, getPermittedNextStatuses } from "../../src/utils/statusMatrix.js";

describe("Ticket Status Transition Matrix (BR-14 / UNIT-02)", () => {
  it("permits same-status transition (no-op)", () => {
    expect(isValidStatusTransition(TicketStatus.NEW, TicketStatus.NEW)).toBe(true);
    expect(isValidStatusTransition(TicketStatus.OPEN, TicketStatus.OPEN)).toBe(true);
    expect(isValidStatusTransition(TicketStatus.IN_PROGRESS, TicketStatus.IN_PROGRESS)).toBe(true);
  });

  it("permits valid transitions from NEW", () => {
    expect(isValidStatusTransition(TicketStatus.NEW, TicketStatus.OPEN)).toBe(true);
    expect(isValidStatusTransition(TicketStatus.NEW, TicketStatus.IN_PROGRESS)).toBe(true);
    expect(isValidStatusTransition(TicketStatus.NEW, TicketStatus.CANCELLED)).toBe(true);

    expect(isValidStatusTransition(TicketStatus.NEW, TicketStatus.RESOLVED)).toBe(false);
    expect(isValidStatusTransition(TicketStatus.NEW, TicketStatus.CLOSED)).toBe(false);
    expect(isValidStatusTransition(TicketStatus.NEW, TicketStatus.WAITING_FOR_REQUESTER)).toBe(false);
  });

  it("permits valid transitions from OPEN", () => {
    expect(isValidStatusTransition(TicketStatus.OPEN, TicketStatus.IN_PROGRESS)).toBe(true);
    expect(isValidStatusTransition(TicketStatus.OPEN, TicketStatus.WAITING_FOR_REQUESTER)).toBe(true);
    expect(isValidStatusTransition(TicketStatus.OPEN, TicketStatus.RESOLVED)).toBe(true);
    expect(isValidStatusTransition(TicketStatus.OPEN, TicketStatus.CANCELLED)).toBe(true);

    expect(isValidStatusTransition(TicketStatus.OPEN, TicketStatus.CLOSED)).toBe(false);
    expect(isValidStatusTransition(TicketStatus.OPEN, TicketStatus.REOPENED)).toBe(false);
  });

  it("permits valid transitions from IN_PROGRESS", () => {
    expect(isValidStatusTransition(TicketStatus.IN_PROGRESS, TicketStatus.WAITING_FOR_REQUESTER)).toBe(true);
    expect(isValidStatusTransition(TicketStatus.IN_PROGRESS, TicketStatus.RESOLVED)).toBe(true);
    expect(isValidStatusTransition(TicketStatus.IN_PROGRESS, TicketStatus.CANCELLED)).toBe(true);

    expect(isValidStatusTransition(TicketStatus.IN_PROGRESS, TicketStatus.OPEN)).toBe(false);
    expect(isValidStatusTransition(TicketStatus.IN_PROGRESS, TicketStatus.CLOSED)).toBe(false);
  });

  it("permits valid transitions from WAITING_FOR_REQUESTER", () => {
    expect(isValidStatusTransition(TicketStatus.WAITING_FOR_REQUESTER, TicketStatus.IN_PROGRESS)).toBe(true);
    expect(isValidStatusTransition(TicketStatus.WAITING_FOR_REQUESTER, TicketStatus.RESOLVED)).toBe(true);
    expect(isValidStatusTransition(TicketStatus.WAITING_FOR_REQUESTER, TicketStatus.CANCELLED)).toBe(true);

    expect(isValidStatusTransition(TicketStatus.WAITING_FOR_REQUESTER, TicketStatus.NEW)).toBe(false);
  });

  it("permits valid transitions from RESOLVED", () => {
    expect(isValidStatusTransition(TicketStatus.RESOLVED, TicketStatus.CLOSED)).toBe(true);
    expect(isValidStatusTransition(TicketStatus.RESOLVED, TicketStatus.REOPENED)).toBe(true);

    expect(isValidStatusTransition(TicketStatus.RESOLVED, TicketStatus.IN_PROGRESS)).toBe(false);
    expect(isValidStatusTransition(TicketStatus.RESOLVED, TicketStatus.CANCELLED)).toBe(false);
  });

  it("permits valid transitions from REOPENED", () => {
    expect(isValidStatusTransition(TicketStatus.REOPENED, TicketStatus.IN_PROGRESS)).toBe(true);
    expect(isValidStatusTransition(TicketStatus.REOPENED, TicketStatus.RESOLVED)).toBe(true);

    expect(isValidStatusTransition(TicketStatus.REOPENED, TicketStatus.CLOSED)).toBe(false);
  });

  it("rejects all transitions from terminal states CLOSED and CANCELLED", () => {
    Object.values(TicketStatus).forEach((target) => {
      if (target !== TicketStatus.CLOSED) {
        expect(isValidStatusTransition(TicketStatus.CLOSED, target)).toBe(false);
      }
      if (target !== TicketStatus.CANCELLED) {
        expect(isValidStatusTransition(TicketStatus.CANCELLED, target)).toBe(false);
      }
    });
  });

  it("returns correct list of permitted next statuses", () => {
    expect(getPermittedNextStatuses(TicketStatus.NEW)).toEqual([
      TicketStatus.OPEN,
      TicketStatus.IN_PROGRESS,
      TicketStatus.CANCELLED,
    ]);
    expect(getPermittedNextStatuses(TicketStatus.CLOSED)).toEqual([]);
  });
});
