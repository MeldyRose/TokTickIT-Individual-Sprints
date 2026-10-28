import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import bcrypt from "bcryptjs";
import { Role, TicketStatus } from "@prisma/client";

describe("Lab 4: Ticket Workflow, Resolution Gate & Stale-Update Conflict Enforcement (ticket-workflow.api.test.ts)", () => {
  const prisma = getPrisma();

  let staffUser: any;
  let staffToken = "";

  let adminUser: any;
  let adminToken = "";

  let requesterUser: any;
  let requesterToken = "";

  let otherRequesterUser: any;
  let otherRequesterToken = "";

  let testCategory: any;
  let testSystem: any;

  beforeEach(async () => {
    const passwordHash = bcrypt.hashSync("Password123!", 10);

    // 1. Create test users
    staffUser = await prisma.user.upsert({
      where: { email: "staff.workflow.test@toktickit.com" },
      update: { role: Role.IT_STAFF, isActive: true, mustChangePassword: false, passwordHash },
      create: {
        name: "Staff Workflow Tester",
        email: "staff.workflow.test@toktickit.com",
        role: Role.IT_STAFF,
        isActive: true,
        mustChangePassword: false,
        passwordHash,
      },
    });

    adminUser = await prisma.user.upsert({
      where: { email: "admin.workflow.test@toktickit.com" },
      update: { role: Role.ADMINISTRATOR, isActive: true, mustChangePassword: false, passwordHash },
      create: {
        name: "Admin Workflow Tester",
        email: "admin.workflow.test@toktickit.com",
        role: Role.ADMINISTRATOR,
        isActive: true,
        mustChangePassword: false,
        passwordHash,
      },
    });

    requesterUser = await prisma.user.upsert({
      where: { email: "requester.workflow.test@toktickit.com" },
      update: { role: Role.REQUESTER, isActive: true, mustChangePassword: false, passwordHash },
      create: {
        name: "Requester Workflow Tester",
        email: "requester.workflow.test@toktickit.com",
        role: Role.REQUESTER,
        isActive: true,
        mustChangePassword: false,
        passwordHash,
      },
    });

    otherRequesterUser = await prisma.user.upsert({
      where: { email: "other.requester.workflow.test@toktickit.com" },
      update: { role: Role.REQUESTER, isActive: true, mustChangePassword: false, passwordHash },
      create: {
        name: "Other Requester Workflow Tester",
        email: "other.requester.workflow.test@toktickit.com",
        role: Role.REQUESTER,
        isActive: true,
        mustChangePassword: false,
        passwordHash,
      },
    });

    // 2. Ensure test Category & Related System
    testCategory = await prisma.category.upsert({
      where: { name: "Workflow Testing Category" },
      update: { isActive: true },
      create: { name: "Workflow Testing Category", description: "Used for workflow tests" },
    });

    testSystem = await prisma.relatedSystem.upsert({
      where: { name: "Workflow Testing System" },
      update: { isActive: true },
      create: { name: "Workflow Testing System", description: "Used for workflow tests" },
    });

    // 3. Authenticate users
    const staffLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "staff.workflow.test@toktickit.com", password: "Password123!" });
    const staffCookie = staffLogin.headers["set-cookie"]?.[0] || "";
    staffToken = staffCookie.split(";")[0]?.split("=")[1] || "";

    const adminLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin.workflow.test@toktickit.com", password: "Password123!" });
    const adminCookie = adminLogin.headers["set-cookie"]?.[0] || "";
    adminToken = adminCookie.split(";")[0]?.split("=")[1] || "";

    const requesterLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "requester.workflow.test@toktickit.com", password: "Password123!" });
    const requesterCookie = requesterLogin.headers["set-cookie"]?.[0] || "";
    requesterToken = requesterCookie.split(";")[0]?.split("=")[1] || "";

    const otherLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "other.requester.workflow.test@toktickit.com", password: "Password123!" });
    const otherCookie = otherLogin.headers["set-cookie"]?.[0] || "";
    otherRequesterToken = otherCookie.split(";")[0]?.split("=")[1] || "";
  });

  afterAll(async () => {
    // Clean up created records
    await prisma.actionTaken.deleteMany({
      where: {
        ticket: {
          summary: { contains: "Workflow Test" },
        },
      },
    });
    await prisma.publicComment.deleteMany({
      where: {
        ticket: {
          summary: { contains: "Workflow Test" },
        },
      },
    });
    await prisma.ticket.deleteMany({
      where: {
        summary: { contains: "Workflow Test" },
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            "staff.workflow.test@toktickit.com",
            "admin.workflow.test@toktickit.com",
            "requester.workflow.test@toktickit.com",
            "other.requester.workflow.test@toktickit.com",
          ],
        },
      },
    });
  });

  // Helper to create ticket
  async function createTestTicket(initialStatus: TicketStatus = TicketStatus.NEW, requesterId = requesterUser.id) {
    const rand = Math.floor(Math.random() * 1000000);
    return prisma.ticket.create({
      data: {
        ticketNumber: `TCK-WF-${rand}`,
        summary: `Workflow Test Ticket ${rand}`,
        description: "Valid ticket description for testing workflows.",
        categoryId: testCategory.id,
        relatedSystemId: testSystem.id,
        currentStatus: initialStatus,
        requesterId,
      },
    });
  }

  describe("1. Ticket Lifecycle Transition Engine (Status Matrix Validation)", () => {
    it("allows IT_STAFF to step through permitted transitions NEW -> OPEN -> IN_PROGRESS", async () => {
      const ticket = await createTestTicket(TicketStatus.NEW);

      // NEW -> OPEN
      const openRes = await request(app)
        .patch(`/api/tickets/${ticket.id}/status`)
        .set("Cookie", [`toktickit_session=${staffToken}`])
        .send({ status: "OPEN" });

      expect(openRes.status).toBe(200);
      expect(openRes.body.currentStatus).toBe("OPEN");

      // OPEN -> IN_PROGRESS
      const inProgressRes = await request(app)
        .patch(`/api/tickets/${ticket.id}/status`)
        .set("Cookie", [`toktickit_session=${staffToken}`])
        .send({ status: "IN_PROGRESS" });

      expect(inProgressRes.status).toBe(200);
      expect(inProgressRes.body.currentStatus).toBe("IN_PROGRESS");
    });

    it("rejects disallowed transition from NEW to CLOSED with 400 Bad Request", async () => {
      const ticket = await createTestTicket(TicketStatus.NEW);

      const res = await request(app)
        .patch(`/api/tickets/${ticket.id}/status`)
        .set("Cookie", [`toktickit_session=${staffToken}`])
        .send({ status: "CLOSED" });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Invalid status transition/i);
    });

    it("rejects disallowed transition from NEW to RESOLVED with 400 Bad Request", async () => {
      const ticket = await createTestTicket(TicketStatus.NEW);

      const res = await request(app)
        .patch(`/api/tickets/${ticket.id}/status`)
        .set("Cookie", [`toktickit_session=${staffToken}`])
        .send({ status: "RESOLVED", resolutionSummary: "This should fail at the matrix check" });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Invalid status transition/i);
    });

    it("rejects transitions from terminal states CLOSED and CANCELLED with 400 Bad Request", async () => {
      const closedTicket = await createTestTicket(TicketStatus.CLOSED);

      const fromClosed = await request(app)
        .patch(`/api/tickets/${closedTicket.id}/status`)
        .set("Cookie", [`toktickit_session=${staffToken}`])
        .send({ status: "OPEN" });

      expect(fromClosed.status).toBe(400);
      expect(fromClosed.body.error).toMatch(/Invalid status transition/i);

      const cancelledTicket = await createTestTicket(TicketStatus.CANCELLED);

      const fromCancelled = await request(app)
        .patch(`/api/tickets/${cancelledTicket.id}/status`)
        .set("Cookie", [`toktickit_session=${staffToken}`])
        .send({ status: "IN_PROGRESS" });

      expect(fromCancelled.status).toBe(400);
      expect(fromCancelled.body.error).toMatch(/Invalid status transition/i);
    });

    it("rejects unrecognized status values with 400 Bad Request", async () => {
      const ticket = await createTestTicket(TicketStatus.OPEN);

      const res = await request(app)
        .patch(`/api/tickets/${ticket.id}/status`)
        .set("Cookie", [`toktickit_session=${staffToken}`])
        .send({ status: "INVALID_STATUS_VALUE" });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Invalid status transition/i);
    });
  });

  describe("2. Role-Based Authorization & Advisory Requester Resolution", () => {
    it("rejects unauthenticated status change requests with 401 Unauthorized", async () => {
      const ticket = await createTestTicket(TicketStatus.NEW);

      const res = await request(app)
        .patch(`/api/tickets/${ticket.id}/status`)
        .send({ status: "OPEN" });

      expect(res.status).toBe(401);
    });

    it("rejects REQUESTER attempting direct transition to RESOLVED with 403 Forbidden", async () => {
      const ticket = await createTestTicket(TicketStatus.IN_PROGRESS, requesterUser.id);

      const res = await request(app)
        .patch(`/api/tickets/${ticket.id}/status`)
        .set("Cookie", [`toktickit_session=${requesterToken}`])
        .send({ status: "RESOLVED", resolutionSummary: "Requester trying to resolve directly" });

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/Requesters cannot set ticket status to RESOLVED or CLOSED/i);
    });

    it("rejects REQUESTER attempting direct transition to CLOSED with 403 Forbidden", async () => {
      const ticket = await createTestTicket(TicketStatus.RESOLVED, requesterUser.id);

      const res = await request(app)
        .patch(`/api/tickets/${ticket.id}/status`)
        .set("Cookie", [`toktickit_session=${requesterToken}`])
        .send({ status: "CLOSED" });

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/Requesters cannot set ticket status to RESOLVED or CLOSED/i);
    });

    it("allows REQUESTER to trigger advisory 'Problem Appears Resolved' transitioning to WAITING_FOR_REQUESTER", async () => {
      const ticket = await createTestTicket(TicketStatus.IN_PROGRESS, requesterUser.id);

      const res = await request(app)
        .patch(`/api/tickets/${ticket.id}/status`)
        .set("Cookie", [`toktickit_session=${requesterToken}`])
        .send({
          status: "WAITING_FOR_REQUESTER",
          comment: "I checked the printer and the issue seems resolved.",
        });

      expect(res.status).toBe(200);
      expect(res.body.currentStatus).toBe("WAITING_FOR_REQUESTER");

      // Verify public comment was created
      const comments = await prisma.publicComment.findMany({
        where: { ticketId: ticket.id },
      });
      expect(comments.length).toBe(1);
      expect(comments[0].content).toContain("printer and the issue seems resolved");
    });

    it("rejects REQUESTER attempting status change on an unowned ticket with 403 Forbidden", async () => {
      const ticket = await createTestTicket(TicketStatus.OPEN, requesterUser.id);

      const res = await request(app)
        .patch(`/api/tickets/${ticket.id}/status`)
        .set("Cookie", [`toktickit_session=${otherRequesterToken}`])
        .send({ status: "WAITING_FOR_REQUESTER" });

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/Access denied to unowned ticket/i);
    });
  });

  describe("3. Resolution Gate Enforcement (HTTP 422 vs 200)", () => {
    it("rejects transition to RESOLVED with 422 Unprocessable Entity when zero Actions Taken exist and summary is missing", async () => {
      const ticket = await createTestTicket(TicketStatus.OPEN);

      const res = await request(app)
        .patch(`/api/tickets/${ticket.id}/status`)
        .set("Cookie", [`toktickit_session=${staffToken}`])
        .send({ status: "RESOLVED" });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("RESOLUTION_GATE_FAILED");
      expect(res.body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ criterion: "MISSING_ACTION_TAKEN" }),
          expect.objectContaining({ criterion: "MISSING_RESOLUTION_SUMMARY" }),
        ])
      );
    });

    it("rejects transition to RESOLVED with 422 if resolution summary is under 10 characters", async () => {
      const ticket = await createTestTicket(TicketStatus.OPEN);

      // Add 1 Action Taken
      await prisma.actionTaken.create({
        data: {
          ticketId: ticket.id,
          actionDateTime: new Date(),
          description: "Configured port mirroring on Core Switch.",
          result: "Port mirror active and capturing packets.",
          performerId: staffUser.id,
          followUpRequired: false,
        },
      });

      const res = await request(app)
        .patch(`/api/tickets/${ticket.id}/status`)
        .set("Cookie", [`toktickit_session=${staffToken}`])
        .send({
          status: "RESOLVED",
          resolutionSummary: "Short", // < 10 chars
        });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("RESOLUTION_GATE_FAILED");
      expect(res.body.error.details).toEqual([
        expect.objectContaining({ criterion: "MISSING_RESOLUTION_SUMMARY" }),
      ]);
    });

    it("rejects transition to RESOLVED with 422 if resolution summary is present but zero actions taken exist", async () => {
      const ticket = await createTestTicket(TicketStatus.OPEN);

      const res = await request(app)
        .patch(`/api/tickets/${ticket.id}/status`)
        .set("Cookie", [`toktickit_session=${staffToken}`])
        .send({
          status: "RESOLVED",
          resolutionSummary: "Replaced faulty Ethernet cable and restored uplink successfully.",
        });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("RESOLUTION_GATE_FAILED");
      expect(res.body.error.details).toEqual([
        expect.objectContaining({ criterion: "MISSING_ACTION_TAKEN" }),
      ]);
    });

    it("allows transition to RESOLVED when all Resolution Gate criteria are satisfied (AC-11)", async () => {
      const ticket = await createTestTicket(TicketStatus.OPEN);

      // Add 1 Action Taken
      await prisma.actionTaken.create({
        data: {
          ticketId: ticket.id,
          actionDateTime: new Date(),
          description: "Cleaned optical fiber connector and re-seated transceiver.",
          result: "Fiber link light turned solid green.",
          performerId: staffUser.id,
          followUpRequired: false,
        },
      });

      const res = await request(app)
        .patch(`/api/tickets/${ticket.id}/status`)
        .set("Cookie", [`toktickit_session=${staffToken}`])
        .send({
          status: "RESOLVED",
          resolutionSummary: "Cleaned optical fiber connector and re-seated transceiver; connection restored.",
        });

      expect(res.status).toBe(200);
      expect(res.body.currentStatus).toBe("RESOLVED");
      expect(res.body.resolvedAt).toBeTruthy();
      expect(res.body.resolutionSummary).toBe(
        "Cleaned optical fiber connector and re-seated transceiver; connection restored."
      );
    });

    it("enforces Resolution Gate (actions >= 1) when transitioning to CLOSED per BR-11", async () => {
      const ticket = await createTestTicket(TicketStatus.RESOLVED);

      // Attempt to close ticket with 0 actions
      const failCloseRes = await request(app)
        .patch(`/api/tickets/${ticket.id}/status`)
        .set("Cookie", [`toktickit_session=${staffToken}`])
        .send({ status: "CLOSED" });

      expect(failCloseRes.status).toBe(422);
      expect(failCloseRes.body.error.code).toBe("RESOLUTION_GATE_FAILED");
      expect(failCloseRes.body.error.details[0].criterion).toBe("MISSING_ACTION_TAKEN");

      // Add action taken
      await prisma.actionTaken.create({
        data: {
          ticketId: ticket.id,
          actionDateTime: new Date(),
          description: "Verified customer satisfaction and closed out ticket.",
          result: "Customer confirmed all systems working.",
          performerId: staffUser.id,
          followUpRequired: false,
        },
      });

      // Now close should succeed
      const successCloseRes = await request(app)
        .patch(`/api/tickets/${ticket.id}/status`)
        .set("Cookie", [`toktickit_session=${staffToken}`])
        .send({ status: "CLOSED" });

      expect(successCloseRes.status).toBe(200);
      expect(successCloseRes.body.currentStatus).toBe("CLOSED");
      expect(successCloseRes.body.closedAt).toBeTruthy();
    });

    it("resets resolvedAt and closedAt to null when reopening ticket (BR-14)", async () => {
      const ticket = await createTestTicket(TicketStatus.RESOLVED);
      await prisma.ticket.update({
        where: { id: ticket.id },
        data: {
          resolvedAt: new Date(),
          resolutionSummary: "Previous resolution note.",
        },
      });

      const reopenRes = await request(app)
        .patch(`/api/tickets/${ticket.id}/status`)
        .set("Cookie", [`toktickit_session=${staffToken}`])
        .send({ status: "REOPENED" });

      expect(reopenRes.status).toBe(200);
      expect(reopenRes.body.currentStatus).toBe("REOPENED");
      expect(reopenRes.body.resolvedAt).toBeNull();
      expect(reopenRes.body.closedAt).toBeNull();
    });
  });

  describe("4. Optimistic Concurrency Control (OCC) / Stale-Update Collision Handling", () => {
    it("rejects stale update attempt with 409 Conflict (code STALE_UPDATE)", async () => {
      const ticket = await createTestTicket(TicketStatus.OPEN);

      // Simulate a concurrent update by another user that advances updatedAt
      await new Promise((r) => setTimeout(r, 1100));
      await prisma.ticket.update({
        where: { id: ticket.id },
        data: { description: "Concurrent update description change." },
      });

      // User submits update with stale timestamp
      const staleTimestamp = ticket.updatedAt.toISOString();

      const res = await request(app)
        .patch(`/api/tickets/${ticket.id}/status`)
        .set("Cookie", [`toktickit_session=${staffToken}`])
        .send({
          status: "IN_PROGRESS",
          expectedUpdatedAt: staleTimestamp,
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("STALE_UPDATE");
      expect(res.body.error.message).toMatch(/modified by another user/i);
      expect(res.body.error.currentUpdatedAt).toBeTruthy();
    });

    it("succeeds when expectedUpdatedAt matches current record updatedAt", async () => {
      const ticket = await createTestTicket(TicketStatus.OPEN);

      const res = await request(app)
        .patch(`/api/tickets/${ticket.id}/status`)
        .set("Cookie", [`toktickit_session=${staffToken}`])
        .send({
          status: "IN_PROGRESS",
          expectedUpdatedAt: ticket.updatedAt.toISOString(),
        });

      expect(res.status).toBe(200);
      expect(res.body.currentStatus).toBe("IN_PROGRESS");
    });
  });
});
