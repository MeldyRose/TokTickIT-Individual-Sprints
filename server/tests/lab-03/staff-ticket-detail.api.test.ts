import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import bcrypt from "bcryptjs";

describe("IT Staff Ticket Detail Operations API (Issue 18)", () => {
  let staffToken = "";
  let staffId = "";
  let otherStaffToken = "";
  let otherStaffId = "";
  let requesterToken = "";
  let requesterId = "";
  let categoryId = "";
  let relatedSystemId = "";

  beforeEach(async () => {
    const passwordHash = bcrypt.hashSync("Password123!", 10);

    // Create Staff User A
    let staffA = await getPrisma().user.findUnique({ where: { email: "alex.staff18@toktickit.com" } });
    if (!staffA) {
      staffA = await getPrisma().user.create({
        data: {
          name: "Alex Staff18",
          email: "alex.staff18@toktickit.com",
          passwordHash,
          role: "IT_STAFF",
          isActive: true,
          mustChangePassword: false,
        },
      });
    }
    staffId = staffA.id;

    // Create Staff User B
    let staffB = await getPrisma().user.findUnique({ where: { email: "sarah.staff18@toktickit.com" } });
    if (!staffB) {
      staffB = await getPrisma().user.create({
        data: {
          name: "Sarah Staff18",
          email: "sarah.staff18@toktickit.com",
          passwordHash,
          role: "IT_STAFF",
          isActive: true,
          mustChangePassword: false,
        },
      });
    }
    otherStaffId = staffB.id;

    // Create Requester User
    let reqUser = await getPrisma().user.findUnique({ where: { email: "jennifer.req18@toktickit.com" } });
    if (!reqUser) {
      reqUser = await getPrisma().user.create({
        data: {
          name: "Jennifer Req18",
          email: "jennifer.req18@toktickit.com",
          passwordHash,
          role: "REQUESTER",
          isActive: true,
          mustChangePassword: false,
        },
      });
    }
    requesterId = reqUser.id;

    // Login Staff A
    const loginStaffA = await request(app)
      .post("/api/auth/login")
      .send({ email: "alex.staff18@toktickit.com", password: "Password123!" });
    const cookiesStaffA = loginStaffA.headers["set-cookie"];
    if (cookiesStaffA) {
      const match = cookiesStaffA[0].match(/toktickit_session=([^;]+)/);
      if (match) staffToken = match[1];
    }

    // Login Staff B
    const loginStaffB = await request(app)
      .post("/api/auth/login")
      .send({ email: "sarah.staff18@toktickit.com", password: "Password123!" });
    const cookiesStaffB = loginStaffB.headers["set-cookie"];
    if (cookiesStaffB) {
      const match = cookiesStaffB[0].match(/toktickit_session=([^;]+)/);
      if (match) otherStaffToken = match[1];
    }

    // Login Requester
    const loginReq = await request(app)
      .post("/api/auth/login")
      .send({ email: "jennifer.req18@toktickit.com", password: "Password123!" });
    const cookiesReq = loginReq.headers["set-cookie"];
    if (cookiesReq) {
      const match = cookiesReq[0].match(/toktickit_session=([^;]+)/);
      if (match) requesterToken = match[1];
    }

    // Category and System
    const catRes = await request(app).get("/api/categories");
    if (catRes.body.length > 0) categoryId = catRes.body[0].id;

    const sysRes = await request(app).get("/api/related-systems");
    if (sysRes.body.length > 0) relatedSystemId = sysRes.body[0].id;
  });

  describe("Claim or Reassign Ticket Ownership (PATCH /api/tickets/:id/owner - AC-06, BR-11, API-08)", () => {
    it("allows IT Staff to claim unassigned ticket (omitting ownerId sets to current user)", async () => {
      const ticketRes = await request(app)
        .post("/api/tickets")
        .set("Cookie", [`toktickit_session=${requesterToken}`])
        .send({
          summary: "Unassigned ticket for claim test",
          categoryId,
          relatedSystemId,
        });

      const ticketId = ticketRes.body.id;

      const claimRes = await request(app)
        .patch(`/api/tickets/${ticketId}/owner`)
        .set("Cookie", [`toktickit_session=${staffToken}`])
        .send({});

      expect(claimRes.status).toBe(200);
      expect(claimRes.body.message).toMatch(/Ticket ownership updated/i);
      expect(claimRes.body.owner.id).toBe(staffId);
      expect(claimRes.body.owner.name).toBe("Alex Staff18");
    });

    it("allows IT Staff to reassign ticket to another active IT Staff member", async () => {
      const ticketRes = await request(app)
        .post("/api/tickets")
        .set("Cookie", [`toktickit_session=${requesterToken}`])
        .send({
          summary: "Ticket for reassign test",
          categoryId,
          relatedSystemId,
        });

      const ticketId = ticketRes.body.id;

      const reassignRes = await request(app)
        .patch(`/api/tickets/${ticketId}/owner`)
        .set("Cookie", [`toktickit_session=${staffToken}`])
        .send({ ownerId: otherStaffId });

      expect(reassignRes.status).toBe(200);
      expect(reassignRes.body.owner.id).toBe(otherStaffId);
      expect(reassignRes.body.owner.name).toBe("Sarah Staff18");
    });

    it("rejects ownership change attempts by Requesters with 403 Forbidden", async () => {
      const ticketRes = await request(app)
        .post("/api/tickets")
        .set("Cookie", [`toktickit_session=${requesterToken}`])
        .send({
          summary: "Ticket for requester forbidden test",
          categoryId,
          relatedSystemId,
        });

      const ticketId = ticketRes.body.id;

      const claimRes = await request(app)
        .patch(`/api/tickets/${ticketId}/owner`)
        .set("Cookie", [`toktickit_session=${requesterToken}`])
        .send({});

      expect(claimRes.status).toBe(403);
    });

    it("rejects reassigning to a Requester or non-existent user with 400 Bad Request", async () => {
      const ticketRes = await request(app)
        .post("/api/tickets")
        .set("Cookie", [`toktickit_session=${requesterToken}`])
        .send({
          summary: "Ticket for invalid target owner test",
          categoryId,
          relatedSystemId,
        });

      const ticketId = ticketRes.body.id;

      // Target is Requester
      const reassignReqRes = await request(app)
        .patch(`/api/tickets/${ticketId}/owner`)
        .set("Cookie", [`toktickit_session=${staffToken}`])
        .send({ ownerId: requesterId });

      expect(reassignReqRes.status).toBe(400);

      // Target does not exist
      const reassignFakeRes = await request(app)
        .patch(`/api/tickets/${ticketId}/owner`)
        .set("Cookie", [`toktickit_session=${staffToken}`])
        .send({ ownerId: "non-existent-user-id" });

      expect(reassignFakeRes.status).toBe(400);
    });
  });

  describe("Update IT Priority (PATCH /api/tickets/:id/priority - AC-07, BR-12, API-09)", () => {
    it("allows IT Staff to update itPriority while leaving requestedPriority unchanged", async () => {
      const ticketRes = await request(app)
        .post("/api/tickets")
        .set("Cookie", [`toktickit_session=${requesterToken}`])
        .send({
          summary: "Priority update test ticket",
          categoryId,
          relatedSystemId,
          requestedPriority: "MEDIUM",
        });

      const ticketId = ticketRes.body.id;

      const updatePriorityRes = await request(app)
        .patch(`/api/tickets/${ticketId}/priority`)
        .set("Cookie", [`toktickit_session=${staffToken}`])
        .send({ itPriority: "URGENT" });

      expect(updatePriorityRes.status).toBe(200);
      expect(updatePriorityRes.body.itPriority).toBe("URGENT");

      // Verify ticket detail retains requestedPriority: MEDIUM and itPriority: URGENT
      const detailRes = await request(app)
        .get(`/api/tickets/${ticketId}`)
        .set("Cookie", [`toktickit_session=${staffToken}`]);

      expect(detailRes.status).toBe(200);
      expect(detailRes.body.requestedPriority).toBe("MEDIUM");
      expect(detailRes.body.itPriority).toBe("URGENT");
    });

    it("rejects invalid itPriority enum values with 400 Bad Request", async () => {
      const ticketRes = await request(app)
        .post("/api/tickets")
        .set("Cookie", [`toktickit_session=${requesterToken}`])
        .send({
          summary: "Invalid priority test ticket",
          categoryId,
          relatedSystemId,
        });

      const ticketId = ticketRes.body.id;

      const invalidRes = await request(app)
        .patch(`/api/tickets/${ticketId}/priority`)
        .set("Cookie", [`toktickit_session=${staffToken}`])
        .send({ itPriority: "SUPER_URGENT" });

      expect(invalidRes.status).toBe(400);
    });

    it("rejects IT priority update attempts by Requesters with 403 Forbidden", async () => {
      const ticketRes = await request(app)
        .post("/api/tickets")
        .set("Cookie", [`toktickit_session=${requesterToken}`])
        .send({
          summary: "Requester priority forbidden test ticket",
          categoryId,
          relatedSystemId,
        });

      const ticketId = ticketRes.body.id;

      const reqRes = await request(app)
        .patch(`/api/tickets/${ticketId}/priority`)
        .set("Cookie", [`toktickit_session=${requesterToken}`])
        .send({ itPriority: "HIGH" });

      expect(reqRes.status).toBe(403);
    });
  });

  describe("Permitted Status Transitions (PATCH /api/tickets/:id/status - AC-08, BR-14, API-10)", () => {
    it("allows IT Staff to perform permitted status transition and returns 200 OK", async () => {
      const ticketRes = await request(app)
        .post("/api/tickets")
        .set("Cookie", [`toktickit_session=${requesterToken}`])
        .send({
          summary: "Status transition test ticket",
          categoryId,
          relatedSystemId,
        });

      const ticketId = ticketRes.body.id; // currentStatus: NEW

      // Valid transition: NEW -> OPEN
      const openRes = await request(app)
        .patch(`/api/tickets/${ticketId}/status`)
        .set("Cookie", [`toktickit_session=${staffToken}`])
        .send({ status: "OPEN" });

      expect(openRes.status).toBe(200);
      expect(openRes.body.currentStatus).toBe("OPEN");

      // Valid transition: OPEN -> IN_PROGRESS
      const inProgressRes = await request(app)
        .patch(`/api/tickets/${ticketId}/status`)
        .set("Cookie", [`toktickit_session=${staffToken}`])
        .send({ status: "IN_PROGRESS" });

      expect(inProgressRes.status).toBe(200);
      expect(inProgressRes.body.currentStatus).toBe("IN_PROGRESS");
    });

    it("rejects invalid status transitions with 400 Bad Request", async () => {
      const ticketRes = await request(app)
        .post("/api/tickets")
        .set("Cookie", [`toktickit_session=${requesterToken}`])
        .send({
          summary: "Invalid transition test ticket",
          categoryId,
          relatedSystemId,
        });

      const ticketId = ticketRes.body.id; // currentStatus: NEW

      // Invalid transition: NEW -> CLOSED
      const invalidRes = await request(app)
        .patch(`/api/tickets/${ticketId}/status`)
        .set("Cookie", [`toktickit_session=${staffToken}`])
        .send({ status: "CLOSED" });

      expect(invalidRes.status).toBe(400);
      expect(invalidRes.body.error).toMatch(/Invalid status transition/i);
    });
  });
});
