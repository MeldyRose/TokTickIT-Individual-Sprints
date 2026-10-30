import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import bcrypt from "bcryptjs";
import { Role, TicketStatus } from "@prisma/client";

describe("Lab 4: Actions Taken Backend REST API & Role-Based Authorization (actions-taken.api.test.ts)", () => {
  const prisma = getPrisma();

  let staffUser: any;
  let staffToken = "";

  let adminUser: any;
  let adminToken = "";

  let requesterUser: any;
  let requesterToken = "";

  let otherRequesterUser: any;
  let otherRequesterToken = "";

  let inactiveStaffUser: any;
  let inactiveStaffToken = "";

  let testTicket: any;
  let otherUserTicket: any;
  let closedTicket: any;

  const createdTicketIds: string[] = [];

  beforeAll(async () => {
    const passwordHash = bcrypt.hashSync("Password123!", 10);

    // 1. Create or upsert users
    staffUser = await prisma.user.upsert({
      where: { email: "staff.actions.test@toktickit.com" },
      update: { role: Role.IT_STAFF, isActive: true, mustChangePassword: false, passwordHash },
      create: {
        name: "Staff Action Tester",
        email: "staff.actions.test@toktickit.com",
        role: Role.IT_STAFF,
        isActive: true,
        mustChangePassword: false,
        passwordHash,
      },
    });

    adminUser = await prisma.user.upsert({
      where: { email: "admin.actions.test@toktickit.com" },
      update: { role: Role.ADMINISTRATOR, isActive: true, mustChangePassword: false, passwordHash },
      create: {
        name: "Admin Action Tester",
        email: "admin.actions.test@toktickit.com",
        role: Role.ADMINISTRATOR,
        isActive: true,
        mustChangePassword: false,
        passwordHash,
      },
    });

    requesterUser = await prisma.user.upsert({
      where: { email: "requester.actions.test@toktickit.com" },
      update: { role: Role.REQUESTER, isActive: true, mustChangePassword: false, passwordHash },
      create: {
        name: "Requester Action Tester",
        email: "requester.actions.test@toktickit.com",
        role: Role.REQUESTER,
        isActive: true,
        mustChangePassword: false,
        passwordHash,
      },
    });

    otherRequesterUser = await prisma.user.upsert({
      where: { email: "other.requester.actions@toktickit.com" },
      update: { role: Role.REQUESTER, isActive: true, mustChangePassword: false, passwordHash },
      create: {
        name: "Other Requester Tester",
        email: "other.requester.actions@toktickit.com",
        role: Role.REQUESTER,
        isActive: true,
        mustChangePassword: false,
        passwordHash,
      },
    });

    inactiveStaffUser = await prisma.user.upsert({
      where: { email: "inactive.staff.actions@toktickit.com" },
      update: { role: Role.IT_STAFF, isActive: false, mustChangePassword: false, passwordHash },
      create: {
        name: "Inactive Staff Tester",
        email: "inactive.staff.actions@toktickit.com",
        role: Role.IT_STAFF,
        isActive: false,
        mustChangePassword: false,
        passwordHash,
      },
    });

    // 2. Log in and capture sessions
    const staffLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "staff.actions.test@toktickit.com", password: "Password123!" });
    staffToken = staffLogin.headers["set-cookie"]?.[0]?.match(/toktickit_session=([^;]+)/)?.[1] || "";

    const adminLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin.actions.test@toktickit.com", password: "Password123!" });
    adminToken = adminLogin.headers["set-cookie"]?.[0]?.match(/toktickit_session=([^;]+)/)?.[1] || "";

    const reqLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "requester.actions.test@toktickit.com", password: "Password123!" });
    requesterToken = reqLogin.headers["set-cookie"]?.[0]?.match(/toktickit_session=([^;]+)/)?.[1] || "";

    const otherReqLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "other.requester.actions@toktickit.com", password: "Password123!" });
    otherRequesterToken = otherReqLogin.headers["set-cookie"]?.[0]?.match(/toktickit_session=([^;]+)/)?.[1] || "";

    const { sessionStore } = await import("../../src/services/sessionStore.js");
    inactiveStaffToken = sessionStore.createSession(inactiveStaffUser.id);

    // 3. Ensure Category and RelatedSystem exist
    let category = await prisma.category.findFirst({ where: { isActive: true } });
    if (!category) {
      category = await prisma.category.create({
        data: { name: "Test Category", description: "Test Desc" },
      });
    }

    let relatedSystem = await prisma.relatedSystem.findFirst({ where: { isActive: true } });
    if (!relatedSystem) {
      relatedSystem = await prisma.relatedSystem.create({
        data: { name: "Test System", description: "Test System Desc" },
      });
    }

    // 4. Create base test tickets (Tracked for cleanup to prevent test leaks)
    testTicket = await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-ACT-${Date.now()}-1`,
        summary: "Main Test Ticket for Actions Taken",
        description: "Testing create, get, patch actions",
        categoryId: category.id,
        relatedSystemId: relatedSystem.id,
        requesterId: requesterUser.id,
        ownerId: staffUser.id,
      },
    });
    createdTicketIds.push(testTicket.id);

    otherUserTicket = await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-ACT-${Date.now()}-3`,
        summary: "Other User Ticket for Scoping Verification",
        description: "Testing requester isolation",
        categoryId: category.id,
        relatedSystemId: relatedSystem.id,
        requesterId: otherRequesterUser.id,
        ownerId: null,
      },
    });
    createdTicketIds.push(otherUserTicket.id);

    closedTicket = await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-ACT-${Date.now()}-4`,
        summary: "Closed Ticket for Terminal State Verification",
        description: "Testing actions rejection on closed tickets",
        categoryId: category.id,
        relatedSystemId: relatedSystem.id,
        requesterId: requesterUser.id,
        currentStatus: TicketStatus.CLOSED,
        closedAt: new Date(),
      },
    });
    createdTicketIds.push(closedTicket.id);
  });

  afterAll(async () => {
    // Clean up created tickets and their child actions to ensure zero database leaks
    if (createdTicketIds.length > 0) {
      await prisma.actionTaken.deleteMany({ where: { ticketId: { in: createdTicketIds } } });
      await prisma.ticket.deleteMany({ where: { id: { in: createdTicketIds } } });
    }

    await prisma.$disconnect();
  });

  describe("1. POST /api/tickets/:id/actions — Create Action Taken", () => {
    it("allows IT_STAFF to create an Action Taken with valid fields (201 Created)", async () => {
      const res = await request(app)
        .post(`/api/tickets/${testTicket.id}/actions`)
        .set("Cookie", [`toktickit_session=${staffToken}`])
        .send({
          actionDateTime: "2026-10-28T09:15:00.000Z",
          description: "Connected console cable to Switch-SW02 and inspected interfaces.",
          result: "Identified CRC errors on Gi0/24 interface module.",
          followUpRequired: false,
          attachmentNotes: "port_diagnostics.txt",
        });

      expect(res.status).toBe(201);
      expect(res.body.action).toBeDefined();
      expect(res.body.action.id).toBeDefined();
      expect(res.body.action.ticketId).toBe(testTicket.id);
      expect(res.body.action.description).toBe("Connected console cable to Switch-SW02 and inspected interfaces.");
      expect(res.body.action.result).toBe("Identified CRC errors on Gi0/24 interface module.");
      expect(res.body.action.followUpRequired).toBe(false);
      expect(res.body.action.followUpNote).toBeNull();
      expect(res.body.action.attachmentNotes).toBe("port_diagnostics.txt");
      expect(res.body.action.performedBy.id).toBe(staffUser.id);
      expect(res.body.action.performedBy.name).toBe("Staff Action Tester");
      expect(res.body.action.performedBy.role).toBe(Role.IT_STAFF);
    });

    it("allows ADMINISTRATOR to create an Action Taken (201 Created)", async () => {
      const res = await request(app)
        .post(`/api/tickets/${testTicket.id}/actions`)
        .set("Cookie", [`toktickit_session=${adminToken}`])
        .send({
          description: "Administrator performed security audit and configuration backup.",
          result: "Backup archive generated and verified successfully.",
          followUpRequired: false,
        });

      expect(res.status).toBe(201);
      expect(res.body.action.performedBy.id).toBe(adminUser.id);
      expect(res.body.action.performedBy.role).toBe(Role.ADMINISTRATOR);
    });

    it("auto-sets performerId to authenticated session and blocks spoofing attempts", async () => {
      const res = await request(app)
        .post(`/api/tickets/${testTicket.id}/actions`)
        .set("Cookie", [`toktickit_session=${staffToken}`])
        .send({
          performerId: "spoofed-user-id-9999",
          performedById: "spoofed-user-id-8888",
          description: "Testing performer ID spoofing prevention mechanism.",
          result: "Performer should remain authenticated staff user.",
          followUpRequired: false,
        });

      expect(res.status).toBe(201);
      expect(res.body.action.performedBy.id).toBe(staffUser.id);
      expect(res.body.action.performerId).toBe(staffUser.id);
      expect(res.body.action.performedBy.id).not.toBe("spoofed-user-id-9999");
    });

    it("enforces mandatory followUpNote when followUpRequired is true (400 Bad Request)", async () => {
      // 1. Missing followUpNote
      const res1 = await request(app)
        .post(`/api/tickets/${testTicket.id}/actions`)
        .set("Cookie", [`toktickit_session=${staffToken}`])
        .send({
          description: "Conducted diagnostic scan on network infrastructure.",
          result: "Need to replace hardware component.",
          followUpRequired: true,
        });

      expect(res1.status).toBe(400);
      expect(res1.body.error).toBeDefined();
      expect(res1.body.error.code).toBe("INVALID_INPUT");
      expect(res1.body.error.details.some((d: any) => d.field === "followUpNote")).toBe(true);

      // 2. Empty string followUpNote
      const res2 = await request(app)
        .post(`/api/tickets/${testTicket.id}/actions`)
        .set("Cookie", [`toktickit_session=${staffToken}`])
        .send({
          description: "Conducted diagnostic scan on network infrastructure.",
          result: "Need to replace hardware component.",
          followUpRequired: true,
          followUpNote: "   ",
        });

      expect(res2.status).toBe(400);

      // 3. followUpNote under minimum length (< 5 chars)
      const res3 = await request(app)
        .post(`/api/tickets/${testTicket.id}/actions`)
        .set("Cookie", [`toktickit_session=${staffToken}`])
        .send({
          description: "Conducted diagnostic scan on network infrastructure.",
          result: "Need to replace hardware component.",
          followUpRequired: true,
          followUpNote: "abc",
        });

      expect(res3.status).toBe(400);
    });

    it("rejects non-boolean followUpRequired (e.g. string 'false' or numbers) with 400 Bad Request", async () => {
      const res = await request(app)
        .post(`/api/tickets/${testTicket.id}/actions`)
        .set("Cookie", [`toktickit_session=${staffToken}`])
        .send({
          description: "Testing non boolean followUpRequired validation.",
          result: "Should reject non boolean values.",
          followUpRequired: "false",
        });

      expect(res.status).toBe(400);
      expect(res.body.error.details.some((d: any) => d.field === "followUpRequired")).toBe(true);
    });

    it("rejects invalid or future actionDateTime with 400 Bad Request", async () => {
      // 1. Invalid date string
      const res1 = await request(app)
        .post(`/api/tickets/${testTicket.id}/actions`)
        .set("Cookie", [`toktickit_session=${staffToken}`])
        .send({
          description: "Testing invalid date format for action line.",
          result: "Should return 400 Bad Request.",
          actionDateTime: "not-a-valid-iso-date",
          followUpRequired: false,
        });

      expect(res1.status).toBe(400);
      expect(res1.body.error.details.some((d: any) => d.field === "actionDateTime")).toBe(true);

      // 2. Future date (> 1 day in future)
      const futureDate = new Date(Date.now() + 86400000 * 30).toISOString();
      const res2 = await request(app)
        .post(`/api/tickets/${testTicket.id}/actions`)
        .set("Cookie", [`toktickit_session=${staffToken}`])
        .send({
          description: "Testing future date rejection for action line.",
          result: "Should reject future timestamps.",
          actionDateTime: futureDate,
          followUpRequired: false,
        });

      expect(res2.status).toBe(400);
      expect(res2.body.error.details.some((d: any) => d.field === "actionDateTime")).toBe(true);
    });

    it("rejects logging actions on CLOSED or CANCELLED tickets with 400 Bad Request", async () => {
      const res = await request(app)
        .post(`/api/tickets/${closedTicket.id}/actions`)
        .set("Cookie", [`toktickit_session=${staffToken}`])
        .send({
          description: "Attempting to log action on closed ticket.",
          result: "Should be rejected.",
          followUpRequired: false,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain("terminal status");
    });

    it("succeeds when followUpRequired is true and non-empty followUpNote is provided (201 Created)", async () => {
      const res = await request(app)
        .post(`/api/tickets/${testTicket.id}/actions`)
        .set("Cookie", [`toktickit_session=${staffToken}`])
        .send({
          description: "Diagnosed power supply unit fluctuation on core switch.",
          result: "PSU-2 requires immediate vendor RMA replacement.",
          followUpRequired: true,
          followUpNote: "Order replacement PSU from vendor with overnight shipping.",
          attachmentNotes: "vendor_rma_form.pdf",
        });

      expect(res.status).toBe(201);
      expect(res.body.action.followUpRequired).toBe(true);
      expect(res.body.action.followUpNote).toBe("Order replacement PSU from vendor with overnight shipping.");
    });

    it("rejects invalid description and result lengths with 400 Bad Request", async () => {
      // Too short description (< 10 chars)
      const res1 = await request(app)
        .post(`/api/tickets/${testTicket.id}/actions`)
        .set("Cookie", [`toktickit_session=${staffToken}`])
        .send({
          description: "short",
          result: "Valid result note.",
        });
      expect(res1.status).toBe(400);

      // Too short result (< 3 chars)
      const res2 = await request(app)
        .post(`/api/tickets/${testTicket.id}/actions`)
        .set("Cookie", [`toktickit_session=${staffToken}`])
        .send({
          description: "Valid action description exceeding ten characters.",
          result: "no",
        });
      expect(res2.status).toBe(400);
    });

    it("simultaneously claims unassigned ticket when claimTicket is true (AC-03, BR-09)", async () => {
      const unassignedTicket = await prisma.ticket.create({
        data: {
          ticketNumber: `TKT-ACT-CLM-${Date.now()}`,
          summary: "Unassigned Ticket for Claim Verification",
          description: "Testing claimTicket during action creation",
          categoryId: testTicket.categoryId,
          relatedSystemId: testTicket.relatedSystemId,
          requesterId: requesterUser.id,
          ownerId: null,
        },
      });
      createdTicketIds.push(unassignedTicket.id);

      const res = await request(app)
        .post(`/api/tickets/${unassignedTicket.id}/actions`)
        .set("Cookie", [`toktickit_session=${staffToken}`])
        .send({
          description: "Initial triage of unassigned issue and diagnostic check.",
          result: "Claimed ticket and commenced active investigation.",
          followUpRequired: false,
          claimTicket: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.ticketOwnerId).toBe(staffUser.id);

      const updatedTicket = await prisma.ticket.findUnique({ where: { id: unassignedTicket.id } });
      expect(updatedTicket?.ownerId).toBe(staffUser.id);
    });

    it("prevents claimTicket race condition when multiple claims occur concurrently", async () => {
      const raceTicket = await prisma.ticket.create({
        data: {
          ticketNumber: `TKT-ACT-RACE-${Date.now()}`,
          summary: "Race Condition Ticket",
          description: "Testing concurrent claimTicket protection",
          categoryId: testTicket.categoryId,
          relatedSystemId: testTicket.relatedSystemId,
          requesterId: requesterUser.id,
          ownerId: null,
        },
      });
      createdTicketIds.push(raceTicket.id);

      // Run two claims in parallel with different performers
      const [res1, res2] = await Promise.all([
        request(app)
          .post(`/api/tickets/${raceTicket.id}/actions`)
          .set("Cookie", [`toktickit_session=${staffToken}`])
          .send({
            description: "Staff attempting simultaneous claim.",
            result: "Claim attempt 1.",
            followUpRequired: false,
            claimTicket: true,
          }),
        request(app)
          .post(`/api/tickets/${raceTicket.id}/actions`)
          .set("Cookie", [`toktickit_session=${adminToken}`])
          .send({
            description: "Admin attempting simultaneous claim.",
            result: "Claim attempt 2.",
            followUpRequired: false,
            claimTicket: true,
          }),
      ]);

      expect(res1.status).toBe(201);
      expect(res2.status).toBe(201);

      // Verify that both returned ticketOwnerId match the single winner in the DB
      const finalTicket = await prisma.ticket.findUnique({ where: { id: raceTicket.id } });
      expect([staffUser.id, adminUser.id]).toContain(finalTicket?.ownerId);
      expect(res1.body.ticketOwnerId).toBe(finalTicket?.ownerId);
      expect(res2.body.ticketOwnerId).toBe(finalTicket?.ownerId);
    });

    it("does not change ticket owner when claimTicket is false (AC-08, BR-08)", async () => {
      const res = await request(app)
        .post(`/api/tickets/${testTicket.id}/actions`)
        .set("Cookie", [`toktickit_session=${adminToken}`])
        .send({
          description: "Administrator assisted on ticket without taking ownership.",
          result: "Provided technical guidance and assistance.",
          followUpRequired: false,
          claimTicket: false,
        });

      expect(res.status).toBe(201);
      expect(res.body.action.performedBy.id).toBe(adminUser.id);

      const ticketAfter = await prisma.ticket.findUnique({ where: { id: testTicket.id } });
      expect(ticketAfter?.ownerId).toBe(staffUser.id);
    });

    it("rejects REQUESTER role write attempts with 403 Forbidden", async () => {
      const res = await request(app)
        .post(`/api/tickets/${testTicket.id}/actions`)
        .set("Cookie", [`toktickit_session=${requesterToken}`])
        .send({
          description: "Requester trying to inject an action taken.",
          result: "Should be forbidden.",
          followUpRequired: false,
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });

    it("returns 401 Unauthorized for unauthenticated requests", async () => {
      const res = await request(app)
        .post(`/api/tickets/${testTicket.id}/actions`)
        .send({
          description: "Unauthenticated action attempt.",
          result: "Should return 401.",
          followUpRequired: false,
        });

      expect(res.status).toBe(401);
    });

    it("returns 401 Unauthorized for inactive users", async () => {
      const res = await request(app)
        .post(`/api/tickets/${testTicket.id}/actions`)
        .set("Cookie", [`toktickit_session=${inactiveStaffToken}`])
        .send({
          description: "Inactive staff user attempting action log.",
          result: "Should return 401.",
          followUpRequired: false,
        });

      expect(res.status).toBe(401);
    });

    it("returns 404 Not Found for non-existent ticket", async () => {
      const res = await request(app)
        .post("/api/tickets/cuid_non_existent_12345/actions")
        .set("Cookie", [`toktickit_session=${staffToken}`])
        .send({
          description: "Valid description for non existent ticket.",
          result: "Valid result.",
          followUpRequired: false,
        });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("NOT_FOUND");
    });
  });

  describe("2. GET /api/tickets/:id/actions — List Actions Taken", () => {
    let action1: any;
    let action2: any;

    beforeAll(async () => {
      action1 = await prisma.actionTaken.create({
        data: {
          ticketId: testTicket.id,
          performerId: staffUser.id,
          actionDateTime: new Date("2026-10-28T09:00:00.000Z"),
          description: "First chronological action step.",
          result: "Initial findings.",
          followUpRequired: false,
        },
      });

      action2 = await prisma.actionTaken.create({
        data: {
          ticketId: testTicket.id,
          performerId: adminUser.id,
          actionDateTime: new Date("2026-10-28T10:30:00.000Z"),
          description: "Second chronological action step.",
          result: "Secondary findings.",
          followUpRequired: true,
          followUpNote: "Review in next standup.",
        },
      });
    });

    it("returns all actions for a ticket in chronological order for IT_STAFF (200 OK)", async () => {
      const res = await request(app)
        .get(`/api/tickets/${testTicket.id}/actions`)
        .set("Cookie", [`toktickit_session=${staffToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.ticketId).toBe(testTicket.id);
      expect(Array.isArray(res.body.actions)).toBe(true);
      expect(res.body.totalActions).toBeGreaterThanOrEqual(2);

      // Verify chronological order
      const returnedIds = res.body.actions.map((a: any) => a.id);
      expect(returnedIds.indexOf(action1.id)).toBeLessThan(returnedIds.indexOf(action2.id));
    });

    it("allows ADMINISTRATOR to view actions taken on any ticket (200 OK)", async () => {
      const res = await request(app)
        .get(`/api/tickets/${testTicket.id}/actions`)
        .set("Cookie", [`toktickit_session=${adminToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.actions.length).toBeGreaterThanOrEqual(2);
    });

    it("allows REQUESTER to view actions taken on their OWN ticket (200 OK)", async () => {
      const res = await request(app)
        .get(`/api/tickets/${testTicket.id}/actions`)
        .set("Cookie", [`toktickit_session=${requesterToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.ticketId).toBe(testTicket.id);
      expect(res.body.actions.length).toBeGreaterThanOrEqual(2);
    });

    it("rejects REQUESTER viewing actions on ticket owned by another user (403 Forbidden)", async () => {
      const res = await request(app)
        .get(`/api/tickets/${otherUserTicket.id}/actions`)
        .set("Cookie", [`toktickit_session=${requesterToken}`]);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });

    it("returns 401 Unauthorized when unauthenticated", async () => {
      const res = await request(app).get(`/api/tickets/${testTicket.id}/actions`);
      expect(res.status).toBe(401);
    });

    it("returns 404 Not Found if ticket does not exist", async () => {
      const res = await request(app)
        .get("/api/tickets/cuid_non_existent_ticket/actions")
        .set("Cookie", [`toktickit_session=${staffToken}`]);

      expect(res.status).toBe(404);
    });
  });

  describe("3. PATCH /api/tickets/:id/actions/:actionId — Update Action Taken", () => {
    let targetAction: any;

    beforeAll(async () => {
      targetAction = await prisma.actionTaken.create({
        data: {
          ticketId: testTicket.id,
          performerId: staffUser.id,
          actionDateTime: new Date("2026-10-28T09:00:00.000Z"),
          description: "Original action taken description.",
          result: "Original diagnostic result.",
          followUpRequired: true,
          followUpNote: "Original follow-up note.",
          attachmentNotes: "original_notes.txt",
        },
      });
    });

    it("enforces mandatory expectedUpdatedAt on PATCH and returns 400 when missing or invalid", async () => {
      // 1. Missing expectedUpdatedAt
      const res1 = await request(app)
        .patch(`/api/tickets/${testTicket.id}/actions/${targetAction.id}`)
        .set("Cookie", [`toktickit_session=${staffToken}`])
        .send({
          description: "Updating description without expectedUpdatedAt.",
        });

      expect(res1.status).toBe(400);
      expect(res1.body.error.code).toBe("INVALID_INPUT");

      // 2. Invalid date string
      const res2 = await request(app)
        .patch(`/api/tickets/${testTicket.id}/actions/${targetAction.id}`)
        .set("Cookie", [`toktickit_session=${staffToken}`])
        .send({
          description: "Updating description with invalid expectedUpdatedAt.",
          expectedUpdatedAt: "invalid-timestamp",
        });

      expect(res2.status).toBe(400);
      expect(res2.body.error.code).toBe("INVALID_INPUT");
    });

    it("rejects non-boolean followUpRequired on PATCH with 400 Bad Request", async () => {
      const current = await prisma.actionTaken.findUnique({ where: { id: targetAction.id } });

      const res = await request(app)
        .patch(`/api/tickets/${testTicket.id}/actions/${targetAction.id}`)
        .set("Cookie", [`toktickit_session=${staffToken}`])
        .send({
          expectedUpdatedAt: current!.updatedAt.toISOString(),
          followUpRequired: "false",
        });

      expect(res.status).toBe(400);
      expect(res.body.error.details.some((d: any) => d.field === "followUpRequired")).toBe(true);
    });

    it("rejects updating action on CLOSED or CANCELLED ticket with 400 Bad Request", async () => {
      const closedAction = await prisma.actionTaken.create({
        data: {
          ticketId: closedTicket.id,
          performerId: staffUser.id,
          description: "Action on closed ticket.",
          result: "Closed test.",
          followUpRequired: false,
        },
      });

      const res = await request(app)
        .patch(`/api/tickets/${closedTicket.id}/actions/${closedAction.id}`)
        .set("Cookie", [`toktickit_session=${staffToken}`])
        .send({
          expectedUpdatedAt: closedAction.updatedAt.toISOString(),
          description: "Attempting to update action on closed ticket.",
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain("terminal status");
    });

    it("allows IT_STAFF to update description, result, and follow-up (200 OK)", async () => {
      const current = await prisma.actionTaken.findUnique({ where: { id: targetAction.id } });

      const res = await request(app)
        .patch(`/api/tickets/${testTicket.id}/actions/${targetAction.id}`)
        .set("Cookie", [`toktickit_session=${staffToken}`])
        .send({
          expectedUpdatedAt: current!.updatedAt.toISOString(),
          description: "Updated detailed troubleshooting description.",
          result: "Updated resolution outcome.",
          followUpRequired: false,
          attachmentNotes: "updated_attachment.log",
        });

      expect(res.status).toBe(200);
      expect(res.body.action.id).toBe(targetAction.id);
      expect(res.body.action.description).toBe("Updated detailed troubleshooting description.");
      expect(res.body.action.result).toBe("Updated resolution outcome.");
      expect(res.body.action.followUpRequired).toBe(false);
      expect(res.body.action.followUpNote).toBeNull();
      expect(res.body.action.attachmentNotes).toBe("updated_attachment.log");
      expect(res.body.action.performedBy.id).toBe(staffUser.id);
    });

    it("allows ADMINISTRATOR to update an existing Action Taken (200 OK)", async () => {
      const current = await prisma.actionTaken.findUnique({ where: { id: targetAction.id } });

      const res = await request(app)
        .patch(`/api/tickets/${testTicket.id}/actions/${targetAction.id}`)
        .set("Cookie", [`toktickit_session=${adminToken}`])
        .send({
          expectedUpdatedAt: current!.updatedAt.toISOString(),
          result: "Administrator revised result verification.",
        });

      expect(res.status).toBe(200);
      expect(res.body.action.result).toBe("Administrator revised result verification.");
    });

    it("enforces mandatory followUpNote on PATCH if followUpRequired is updated to true", async () => {
      // First update to followUpRequired: false
      const current = await prisma.actionTaken.update({
        where: { id: targetAction.id },
        data: { followUpRequired: false, followUpNote: null },
      });

      const res = await request(app)
        .patch(`/api/tickets/${testTicket.id}/actions/${targetAction.id}`)
        .set("Cookie", [`toktickit_session=${staffToken}`])
        .send({
          expectedUpdatedAt: current.updatedAt.toISOString(),
          followUpRequired: true,
          followUpNote: "",
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("INVALID_INPUT");
    });

    it("rejects REQUESTER update attempt with 403 Forbidden", async () => {
      const current = await prisma.actionTaken.findUnique({ where: { id: targetAction.id } });

      const res = await request(app)
        .patch(`/api/tickets/${testTicket.id}/actions/${targetAction.id}`)
        .set("Cookie", [`toktickit_session=${requesterToken}`])
        .send({
          expectedUpdatedAt: current!.updatedAt.toISOString(),
          description: "Requester trying to update action.",
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });

    it("enforces optimistic concurrency control and rejects stale expectedUpdatedAt with 409 Conflict", async () => {
      const staleTimestamp = new Date(Date.now() - 3600000).toISOString();

      const res = await request(app)
        .patch(`/api/tickets/${testTicket.id}/actions/${targetAction.id}`)
        .set("Cookie", [`toktickit_session=${staffToken}`])
        .send({
          description: "Attempted edit with stale expectedUpdatedAt timestamp.",
          expectedUpdatedAt: staleTimestamp,
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("STALE_UPDATE");
    });

    it("rejects stale updates within the same second (reproduced race condition test)", async () => {
      // 1. Fetch fresh record and timestamp T1
      const initialAction = await prisma.actionTaken.findUnique({ where: { id: targetAction.id } });
      const staleTimestamp = initialAction!.updatedAt.toISOString();

      // 2. First editor updates the action successfully (advancing updatedAt to T2, within hundreds of ms)
      const firstEditRes = await request(app)
        .patch(`/api/tickets/${testTicket.id}/actions/${targetAction.id}`)
        .set("Cookie", [`toktickit_session=${staffToken}`])
        .send({
          expectedUpdatedAt: staleTimestamp,
          description: "First editor update that succeeds.",
        });
      expect(firstEditRes.status).toBe(200);

      // 3. Second editor attempts update with the original stale timestamp (even within < 1 second)
      const secondEditRes = await request(app)
        .patch(`/api/tickets/${testTicket.id}/actions/${targetAction.id}`)
        .set("Cookie", [`toktickit_session=${adminToken}`])
        .send({
          expectedUpdatedAt: staleTimestamp,
          description: "Second editor attempting update with stale timestamp from same second.",
        });

      // Must be rejected with 409 STALE_UPDATE and NOT overwrite first edit
      expect(secondEditRes.status).toBe(409);
      expect(secondEditRes.body.error.code).toBe("STALE_UPDATE");

      // Verify the first editor's content remains preserved in DB
      const verifiedAction = await prisma.actionTaken.findUnique({ where: { id: targetAction.id } });
      expect(verifiedAction!.description).toBe("First editor update that succeeds.");
    });

    it("succeeds when expectedUpdatedAt matches current record updatedAt", async () => {
      const freshAction = await prisma.actionTaken.findUnique({ where: { id: targetAction.id } });
      const currentTimestamp = freshAction!.updatedAt.toISOString();

      const res = await request(app)
        .patch(`/api/tickets/${testTicket.id}/actions/${targetAction.id}`)
        .set("Cookie", [`toktickit_session=${staffToken}`])
        .send({
          description: "Successful edit with fresh expectedUpdatedAt timestamp.",
          expectedUpdatedAt: currentTimestamp,
        });

      expect(res.status).toBe(200);
      expect(res.body.action.description).toBe("Successful edit with fresh expectedUpdatedAt timestamp.");
    });

    it("updates actionDateTime on PATCH and rejects future actionDateTime", async () => {
      const freshAction = await prisma.actionTaken.findUnique({ where: { id: targetAction.id } });
      const currentTimestamp = freshAction!.updatedAt.toISOString();

      // 1. Reject future date
      const futureDate = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      const resFuture = await request(app)
        .patch(`/api/tickets/${testTicket.id}/actions/${targetAction.id}`)
        .set("Cookie", [`toktickit_session=${staffToken}`])
        .send({
          actionDateTime: futureDate,
          expectedUpdatedAt: currentTimestamp,
        });
      expect(resFuture.status).toBe(400);
      expect(resFuture.body.error.message).toMatch(/cannot be in the future/i);

      // 2. Accept valid past date
      const newActionDate = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      const resValid = await request(app)
        .patch(`/api/tickets/${testTicket.id}/actions/${targetAction.id}`)
        .set("Cookie", [`toktickit_session=${staffToken}`])
        .send({
          actionDateTime: newActionDate,
          expectedUpdatedAt: currentTimestamp,
        });
      expect(resValid.status).toBe(200);
      expect(new Date(resValid.body.action.actionDateTime).toISOString()).toBe(new Date(newActionDate).toISOString());
    });

    it("returns 404 Not Found if action does not exist or does not belong to ticket", async () => {
      const res = await request(app)
        .patch(`/api/tickets/${testTicket.id}/actions/cuid_fake_action_9999`)
        .set("Cookie", [`toktickit_session=${staffToken}`])
        .send({
          expectedUpdatedAt: new Date().toISOString(),
          description: "Update on non existent action.",
        });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("NOT_FOUND");
    });
  });
});
