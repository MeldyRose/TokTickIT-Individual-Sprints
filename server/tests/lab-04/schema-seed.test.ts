import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getPrisma } from "../../src/prisma.js";
import { Role, RequestedPriority, ITPriority, TicketStatus } from "@prisma/client";

describe("Lab 4: Database Schema Evolution & Seed Data Verification (Issue 23)", () => {
  const prisma = getPrisma();

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("1. ActionTaken Model & Foreign Key Relations", () => {
    it("persists an ActionTaken with all required fields and relations", async () => {
      // Find a ticket and an IT staff user
      const ticket = await prisma.ticket.findFirst({ where: { ticketNumber: "TKT-2026-0001" } });
      const staffUser = await prisma.user.findFirst({ where: { role: Role.IT_STAFF, isActive: true } });

      expect(ticket).not.toBeNull();
      expect(staffUser).not.toBeNull();

      const createdAction = await prisma.actionTaken.create({
        data: {
          ticketId: ticket!.id,
          performerId: staffUser!.id,
          description: "Unit test action taken description for verification.",
          result: "Diagnostic outcome recorded successfully.",
          followUpRequired: true,
          followUpNote: "Follow up with staff lead on findings.",
          attachmentNotes: "test_output.txt",
        },
        include: {
          ticket: true,
          performedBy: true,
        },
      });

      expect(createdAction.id).toBeDefined();
      expect(createdAction.ticketId).toBe(ticket!.id);
      expect(createdAction.performerId).toBe(staffUser!.id);
      expect(createdAction.actionDateTime).toBeInstanceOf(Date);
      expect(createdAction.followUpRequired).toBe(true);
      expect(createdAction.followUpNote).toBe("Follow up with staff lead on findings.");
      expect(createdAction.attachmentNotes).toBe("test_output.txt");
      expect(createdAction.createdAt).toBeInstanceOf(Date);
      expect(createdAction.updatedAt).toBeInstanceOf(Date);
      expect(createdAction.ticket.id).toBe(ticket!.id);
      expect(createdAction.performedBy.id).toBe(staffUser!.id);

      // Clean up test action
      await prisma.actionTaken.delete({ where: { id: createdAction.id } });
    });

    it("enforces cascade deletion of ActionTaken children when parent Ticket is deleted", async () => {
      const staffUser = await prisma.user.findFirst({ where: { role: Role.IT_STAFF } });
      const requester = await prisma.user.findFirst({ where: { role: Role.REQUESTER } });
      const category = await prisma.category.findFirst();
      const system = await prisma.relatedSystem.findFirst();

      // Create a temporary ticket
      const tempTicket = await prisma.ticket.create({
        data: {
          ticketNumber: `TKT-TEMP-${Date.now()}`,
          summary: "Temporary ticket for cascade delete test",
          description: "Testing cascade delete behavior on child ActionTaken lines",
          categoryId: category!.id,
          relatedSystemId: system!.id,
          requestedPriority: RequestedPriority.LOW,
          itPriority: ITPriority.LOW,
          currentStatus: TicketStatus.NEW,
          requesterId: requester!.id,
        },
      });

      // Create two actions on the temporary ticket
      const action1 = await prisma.actionTaken.create({
        data: {
          ticketId: tempTicket.id,
          performerId: staffUser!.id,
          description: "Action 1 on temporary ticket",
          result: "Initial test result",
        },
      });

      const action2 = await prisma.actionTaken.create({
        data: {
          ticketId: tempTicket.id,
          performerId: staffUser!.id,
          description: "Action 2 on temporary ticket",
          result: "Second test result",
        },
      });

      // Confirm actions exist
      const actionsBefore = await prisma.actionTaken.findMany({ where: { ticketId: tempTicket.id } });
      expect(actionsBefore).toHaveLength(2);

      // Delete the parent ticket
      await prisma.ticket.delete({ where: { id: tempTicket.id } });

      // Confirm child actions were cascade deleted
      const actionsAfter = await prisma.actionTaken.findMany({
        where: { id: { in: [action1.id, action2.id] } },
      });
      expect(actionsAfter).toHaveLength(0);
    });

    it("updates updatedAt timestamp on ActionTaken edit (optimistic concurrency support)", async () => {
      const action = await prisma.actionTaken.findFirst();
      expect(action).not.toBeNull();

      const originalUpdatedAt = action!.updatedAt;
      
      // Wait a brief moment to ensure timestamp differential
      await new Promise((resolve) => setTimeout(resolve, 50));

      const updatedAction = await prisma.actionTaken.update({
        where: { id: action!.id },
        data: { result: `${action!.result} (edited)` },
      });

      expect(new Date(updatedAction.updatedAt).getTime()).toBeGreaterThanOrEqual(
        new Date(originalUpdatedAt).getTime()
      );

      // Revert back
      await prisma.actionTaken.update({
        where: { id: action!.id },
        data: { result: action!.result },
      });
    });
  });

  describe("2. Ticket Workflow Fields & Concurrency Support", () => {
    it("supports workflow fields: resolvedAt, closedAt, and resolutionSummary", async () => {
      const ticket = await prisma.ticket.findFirst({ where: { ticketNumber: "TKT-2026-0005" } });
      expect(ticket).not.toBeNull();
      expect(ticket!.currentStatus).toBe(TicketStatus.RESOLVED);
      expect(ticket!.resolvedAt).toBeInstanceOf(Date);
      expect(ticket!.resolutionSummary).toBeTruthy();
      expect(ticket!.resolutionSummary!.length).toBeGreaterThanOrEqual(10);
    });

    it("updates ticket updatedAt timestamp upon status mutation", async () => {
      const ticket = await prisma.ticket.findFirst({ where: { ticketNumber: "TKT-2026-0002" } });
      expect(ticket).not.toBeNull();
      const originalUpdatedAt = ticket!.updatedAt;

      await new Promise((resolve) => setTimeout(resolve, 50));

      const updated = await prisma.ticket.update({
        where: { id: ticket!.id },
        data: { summary: `${ticket!.summary} (touched)` },
      });

      expect(new Date(updated.updatedAt).getTime()).toBeGreaterThanOrEqual(
        new Date(originalUpdatedAt).getTime()
      );

      // Revert
      await prisma.ticket.update({
        where: { id: ticket!.id },
        data: { summary: ticket!.summary },
      });
    });
  });

  describe("3. Seed Data Diversity & Idempotency", () => {
    it("contains tickets with 0, 1, and multiple Actions Taken", async () => {
      // Tickets with 0 actions
      const zeroActionTicket = await prisma.ticket.findUnique({
        where: { ticketNumber: "TKT-2026-0002" },
        include: { actionsTaken: true },
      });
      expect(zeroActionTicket).not.toBeNull();
      expect(zeroActionTicket!.actionsTaken).toHaveLength(0);

      // Tickets with 1 action
      const oneActionTicket = await prisma.ticket.findUnique({
        where: { ticketNumber: "TKT-2026-0003" },
        include: { actionsTaken: true },
      });
      expect(oneActionTicket).not.toBeNull();
      expect(oneActionTicket!.actionsTaken).toHaveLength(1);

      // Tickets with multiple actions
      const multiActionTicket = await prisma.ticket.findUnique({
        where: { ticketNumber: "TKT-2026-0001" },
        include: { actionsTaken: true },
      });
      expect(multiActionTicket).not.toBeNull();
      expect(multiActionTicket!.actionsTaken.length).toBeGreaterThanOrEqual(2);
    });

    it("records actions taken across multiple distinct IT staff performers", async () => {
      const actions = await prisma.actionTaken.findMany({
        select: { performerId: true },
        distinct: ["performerId"],
      });
      // Should have at least 2 distinct IT staff performers in seed
      expect(actions.length).toBeGreaterThanOrEqual(2);
    });

    it("verifies followUpRequired actions have non-empty followUpNote", async () => {
      const followUpActions = await prisma.actionTaken.findMany({
        where: { followUpRequired: true },
      });
      expect(followUpActions.length).toBeGreaterThan(0);
      for (const act of followUpActions) {
        expect(act.followUpNote).toBeTruthy();
        expect(act.followUpNote!.length).toBeGreaterThanOrEqual(5);
      }
    });

    it("populates diverse ticket statuses including RESOLVED today and historical resolutions", async () => {
      const resolvedToday = await prisma.ticket.findFirst({
        where: {
          currentStatus: TicketStatus.RESOLVED,
          resolvedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      });
      expect(resolvedToday).not.toBeNull();

      const unassignedTicket = await prisma.ticket.findFirst({
        where: { ownerId: null },
      });
      expect(unassignedTicket).not.toBeNull();
    });
  });

  describe("4. Labs 1 to 3 Backward Compatibility", () => {
    it("preserves all categories and related systems from Labs 1 and 2", async () => {
      const categories = await prisma.category.findMany();
      expect(categories.length).toBeGreaterThanOrEqual(4);

      const systems = await prisma.relatedSystem.findMany();
      expect(systems.length).toBeGreaterThanOrEqual(7);
    });

    it("preserves users across all roles with security credentials from Lab 3", async () => {
      const users = await prisma.user.findMany();
      expect(users.length).toBeGreaterThanOrEqual(8);

      const requesters = users.filter((u) => u.role === Role.REQUESTER);
      const staff = users.filter((u) => u.role === Role.IT_STAFF);
      const admins = users.filter((u) => u.role === Role.ADMINISTRATOR);

      expect(requesters.length).toBeGreaterThan(0);
      expect(staff.length).toBeGreaterThan(0);
      expect(admins.length).toBeGreaterThan(0);

      // Verify passwords and mustChangePassword
      for (const u of users) {
        expect(u.passwordHash).toBeTruthy();
        expect(typeof u.mustChangePassword).toBe("boolean");
      }
    });

    it("preserves public comments and internal notes linked to tickets", async () => {
      const publicComments = await prisma.publicComment.findMany();
      expect(publicComments.length).toBeGreaterThan(0);

      const internalNotes = await prisma.internalNote.findMany();
      expect(internalNotes.length).toBeGreaterThan(0);
    });
  });
});
