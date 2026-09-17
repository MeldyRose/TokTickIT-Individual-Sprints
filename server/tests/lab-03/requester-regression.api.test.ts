import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import bcrypt from "bcryptjs";

describe("Requester Operations & Security Probing API (Issue 16)", () => {
  let requesterToken = "";
  let requesterId = "";
  let otherRequesterToken = "";
  let otherRequesterId = "";
  let staffToken = "";
  let categoryId = "";
  let relatedSystemId = "";

  beforeEach(async () => {
    const passwordHash = bcrypt.hashSync("Password123!", 10);

    let userA = await getPrisma().user.findUnique({ where: { email: "jennifer.test16@toktickit.com" } });
    if (!userA) {
      userA = await getPrisma().user.create({
        data: {
          name: "Jennifer Test16",
          email: "jennifer.test16@toktickit.com",
          passwordHash,
          role: "REQUESTER",
          isActive: true,
          mustChangePassword: false,
        },
      });
    }
    requesterId = userA.id;

    let userB = await getPrisma().user.findUnique({ where: { email: "michael.test16@toktickit.com" } });
    if (!userB) {
      userB = await getPrisma().user.create({
        data: {
          name: "Michael Test16",
          email: "michael.test16@toktickit.com",
          passwordHash,
          role: "REQUESTER",
          isActive: true,
          mustChangePassword: false,
        },
      });
    }
    otherRequesterId = userB.id;

    let staffUser = await getPrisma().user.findUnique({ where: { email: "alex.staff16@toktickit.com" } });
    if (!staffUser) {
      staffUser = await getPrisma().user.create({
        data: {
          name: "Alex Staff16",
          email: "alex.staff16@toktickit.com",
          passwordHash,
          role: "IT_STAFF",
          isActive: true,
          mustChangePassword: false,
        },
      });
    }

    // Log in Requester A
    const loginResA = await request(app)
      .post("/api/auth/login")
      .send({ email: "jennifer.test16@toktickit.com", password: "Password123!" });
    
    const cookiesA = loginResA.headers["set-cookie"];
    if (cookiesA) {
      const match = cookiesA[0].match(/toktickit_session=([^;]+)/);
      if (match) requesterToken = match[1];
    }

    // Log in Requester B
    const loginResB = await request(app)
      .post("/api/auth/login")
      .send({ email: "michael.test16@toktickit.com", password: "Password123!" });
    
    const cookiesB = loginResB.headers["set-cookie"];
    if (cookiesB) {
      const match = cookiesB[0].match(/toktickit_session=([^;]+)/);
      if (match) otherRequesterToken = match[1];
    }

    // Log in Staff
    const loginResStaff = await request(app)
      .post("/api/auth/login")
      .send({ email: "alex.staff16@toktickit.com", password: "Password123!" });
    
    const cookiesStaff = loginResStaff.headers["set-cookie"];
    if (cookiesStaff) {
      const match = cookiesStaff[0].match(/toktickit_session=([^;]+)/);
      if (match) staffToken = match[1];
    }

    // Get categories and systems
    const catRes = await request(app).get("/api/categories");
    if (catRes.body.length > 0) categoryId = catRes.body[0].id;

    const sysRes = await request(app).get("/api/related-systems");
    if (sysRes.body.length > 0) relatedSystemId = sysRes.body[0].id;
  });

  describe("Security Probing: Rejection of X-Requester-Id Header Without Session (PR Review Item 1 & 2)", () => {
    it("returns 401 Unauthorized for GET /api/tickets with only X-Requester-Id (valid ID, admin ID, unknown ID)", async () => {
      const res1 = await request(app).get("/api/tickets").set("X-Requester-Id", requesterId);
      expect(res1.status).toBe(401);
      expect(res1.body.error).toMatch(/Unauthorized/i);

      const res2 = await request(app).get("/api/tickets").set("X-Requester-Id", "admin-user-001");
      expect(res2.status).toBe(401);

      const res3 = await request(app).get("/api/tickets").set("X-Requester-Id", "totally-fake-id");
      expect(res3.status).toBe(401);
    });

    it("returns 401 Unauthorized for POST /api/tickets with only X-Requester-Id", async () => {
      const res = await request(app)
        .post("/api/tickets")
        .set("X-Requester-Id", requesterId)
        .send({
          summary: "Unauthenticated request attempt",
          categoryId,
          relatedSystemId,
        });

      expect(res.status).toBe(401);
    });

    it("returns 401 Unauthorized for Internal Notes GET /api/tickets/:id/notes with only X-Requester-Id: staff-user-001", async () => {
      const res = await request(app)
        .get("/api/tickets/tkt-001/notes")
        .set("X-Requester-Id", "staff-user-001");

      expect(res.status).toBe(401);
    });
  });

  describe("Requester Identity Scoping & Operations", () => {
    it("derives Requester identity from session and ignores X-Requester-Id header (AC-03, BR-22)", async () => {
      const res = await request(app)
        .post("/api/tickets")
        .set("Cookie", [`toktickit_session=${requesterToken}`])
        .set("X-Requester-Id", otherRequesterId)
        .send({
          summary: "Ticket created under session identity",
          description: "Checking AC-03 session scoping",
          categoryId,
          relatedSystemId,
        });

      expect(res.status).toBe(201);
      expect(res.body.requesterId).toBe(requesterId);
      expect(res.body.requesterId).not.toBe(otherRequesterId);
    });

    it("allows Requesters to post and view Public Comments on owned tickets (AC-10)", async () => {
      const ticketRes = await request(app)
        .post("/api/tickets")
        .set("Cookie", [`toktickit_session=${requesterToken}`])
        .send({
          summary: "Public comments test ticket",
          categoryId,
          relatedSystemId,
        });

      const ticketId = ticketRes.body.id;

      const postCommentRes = await request(app)
        .post(`/api/tickets/${ticketId}/comments`)
        .set("Cookie", [`toktickit_session=${requesterToken}`])
        .send({ content: "Please update me when resolved." });

      expect(postCommentRes.status).toBe(201);
      expect(postCommentRes.body.content).toBe("Please update me when resolved.");

      const getCommentsRes = await request(app)
        .get(`/api/tickets/${ticketId}/comments`)
        .set("Cookie", [`toktickit_session=${requesterToken}`]);

      expect(getCommentsRes.status).toBe(200);
      expect(Array.isArray(getCommentsRes.body)).toBe(true);
      expect(getCommentsRes.body.length).toBeGreaterThan(0);
    });

    it("blocks Requesters from accessing Internal Notes with 403 Forbidden (AC-04, BR-04)", async () => {
      const ticketRes = await request(app)
        .post("/api/tickets")
        .set("Cookie", [`toktickit_session=${requesterToken}`])
        .send({
          summary: "Internal notes permission test",
          categoryId,
          relatedSystemId,
        });

      const ticketId = ticketRes.body.id;

      const getNotesRes = await request(app)
        .get(`/api/tickets/${ticketId}/notes`)
        .set("Cookie", [`toktickit_session=${requesterToken}`]);

      expect(getNotesRes.status).toBe(403);
    });

    it("allows Requesters to trigger Problem Appears Resolved but rejects action on CLOSED/CANCELLED tickets (AC-09, BR-05)", async () => {
      const ticketRes = await request(app)
        .post("/api/tickets")
        .set("Cookie", [`toktickit_session=${requesterToken}`])
        .send({
          summary: "Status update test ticket",
          categoryId,
          relatedSystemId,
        });

      const ticketId = ticketRes.body.id;

      // Trigger Problem Appears Resolved on active ticket -> WAITING_FOR_REQUESTER (200 OK)
      const resolvedActionRes = await request(app)
        .patch(`/api/tickets/${ticketId}/status`)
        .set("Cookie", [`toktickit_session=${requesterToken}`])
        .send({ status: "WAITING_FOR_REQUESTER", comment: "Looks fixed on my end." });

      expect(resolvedActionRes.status).toBe(200);
      expect(resolvedActionRes.body.currentStatus).toBe("WAITING_FOR_REQUESTER");

      // IT Staff closes ticket
      await getPrisma().ticket.update({
        where: { id: ticketId },
        data: { currentStatus: "CLOSED" },
      });

      // Requester attempts Problem Appears Resolved on CLOSED ticket -> 400 Bad Request
      const closedActionRes = await request(app)
        .patch(`/api/tickets/${ticketId}/status`)
        .set("Cookie", [`toktickit_session=${requesterToken}`])
        .send({ status: "WAITING_FOR_REQUESTER" });

      expect(closedActionRes.status).toBe(400);
      expect(closedActionRes.body.error).toMatch(/closed, resolved, or cancelled/i);
    });
  });

  describe("IT Staff Status Transition Matrix Validation (BR-14)", () => {
    it("enforces BR-14 permitted status transition matrix and rejects invalid transitions", async () => {
      const ticketRes = await request(app)
        .post("/api/tickets")
        .set("Cookie", [`toktickit_session=${requesterToken}`])
        .send({
          summary: "Staff status transition test ticket",
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

      // Close ticket (OPEN -> CANCELLED / CLOSED)
      await getPrisma().ticket.update({
        where: { id: ticketId },
        data: { currentStatus: "CLOSED" },
      });

      // Invalid transition: CLOSED -> NEW (terminal state) -> 400 Bad Request
      const invalidRes = await request(app)
        .patch(`/api/tickets/${ticketId}/status`)
        .set("Cookie", [`toktickit_session=${staffToken}`])
        .send({ status: "NEW" });

      expect(invalidRes.status).toBe(400);
      expect(invalidRes.body.error).toMatch(/Invalid status transition/i);
    });
  });
});
