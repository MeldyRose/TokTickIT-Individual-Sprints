import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import bcrypt from "bcryptjs";

describe("IT Staff Ticket Queue API (Issue 17, AC-05, BR-21)", () => {
  let staffToken = "";
  let staffId = "";
  let requesterToken = "";
  let requesterId = "";
  let categoryId = "";
  let relatedSystemId = "";

  beforeEach(async () => {
    const passwordHash = bcrypt.hashSync("Password123!", 10);

    let staffUser = await getPrisma().user.findUnique({ where: { email: "staff.queue17@toktickit.com" } });
    if (!staffUser) {
      staffUser = await getPrisma().user.create({
        data: {
          name: "Staff Queue17",
          email: "staff.queue17@toktickit.com",
          passwordHash,
          role: "IT_STAFF",
          isActive: true,
          mustChangePassword: false,
        },
      });
    }
    staffId = staffUser.id;

    let reqUser = await getPrisma().user.findUnique({ where: { email: "req.queue17@toktickit.com" } });
    if (!reqUser) {
      reqUser = await getPrisma().user.create({
        data: {
          name: "Req Queue17",
          email: "req.queue17@toktickit.com",
          passwordHash,
          role: "REQUESTER",
          isActive: true,
          mustChangePassword: false,
        },
      });
    }
    requesterId = reqUser.id;

    // Log in Staff
    const loginStaff = await request(app)
      .post("/api/auth/login")
      .send({ email: "staff.queue17@toktickit.com", password: "Password123!" });
    const cookiesStaff = loginStaff.headers["set-cookie"];
    if (cookiesStaff) {
      const match = cookiesStaff[0].match(/toktickit_session=([^;]+)/);
      if (match) staffToken = match[1];
    }

    // Log in Requester
    const loginReq = await request(app)
      .post("/api/auth/login")
      .send({ email: "req.queue17@toktickit.com", password: "Password123!" });
    const cookiesReq = loginReq.headers["set-cookie"];
    if (cookiesReq) {
      const match = cookiesReq[0].match(/toktickit_session=([^;]+)/);
      if (match) requesterToken = match[1];
    }

    // Get category and system
    const catRes = await request(app).get("/api/categories");
    if (catRes.body.length > 0) categoryId = catRes.body[0].id;

    const sysRes = await request(app).get("/api/related-systems");
    if (sysRes.body.length > 0) relatedSystemId = sysRes.body[0].id;
  });

  describe("GET /api/tickets Queue Functionality", () => {
    it("returns 401 Unauthorized if request is unauthenticated", async () => {
      const res = await request(app).get("/api/tickets");
      expect(res.status).toBe(401);
    });

    it("returns paginated tickets for IT Staff supporting default limits", async () => {
      const res = await request(app)
        .get("/api/tickets")
        .set("Cookie", [`toktickit_session=${staffToken}`]);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("data");
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body).toHaveProperty("pagination");
      expect(res.body.pagination).toHaveProperty("page");
      expect(res.body.pagination).toHaveProperty("totalPages");
    });

    it("supports search query matching summary or ticket number or description", async () => {
      // Create a unique ticket for searching
      const createRes = await request(app)
        .post("/api/tickets")
        .set("Cookie", [`toktickit_session=${staffToken}`])
        .send({
          summary: "UniqueSearchTerm12345",
          description: "Search description testing",
          categoryId,
          relatedSystemId,
          requestedPriority: "HIGH",
        });
      expect(createRes.status).toBe(201);

      const searchRes = await request(app)
        .get("/api/tickets?search=UniqueSearchTerm12345")
        .set("Cookie", [`toktickit_session=${staffToken}`]);

      expect(searchRes.status).toBe(200);
      expect(searchRes.body.data.length).toBeGreaterThanOrEqual(1);
      expect(searchRes.body.data[0].summary).toContain("UniqueSearchTerm12345");
    });

    it("supports status and priority filtering", async () => {
      const res = await request(app)
        .get("/api/tickets?status=NEW&priority=HIGH")
        .set("Cookie", [`toktickit_session=${staffToken}`]);

      expect(res.status).toBe(200);
      for (const t of res.body.data) {
        expect(t.currentStatus).toBe("NEW");
        expect(t.itPriority || t.requestedPriority).toBe("HIGH");
      }
    });

    it("supports ownership filtering (unassigned, me, user ID)", async () => {
      const resUnassigned = await request(app)
        .get("/api/tickets?owner=unassigned")
        .set("Cookie", [`toktickit_session=${staffToken}`]);

      expect(resUnassigned.status).toBe(200);
      for (const t of resUnassigned.body.data) {
        expect(t.ownerId ?? t.owner?.id ?? null).toBeNull();
      }

      const resMe = await request(app)
        .get("/api/tickets?owner=me")
        .set("Cookie", [`toktickit_session=${staffToken}`]);
      expect(resMe.status).toBe(200);
    });

    it("supports sorting and custom page sizes", async () => {
      const res = await request(app)
        .get("/api/tickets?sortBy=createdAt&sortOrder=asc&pageSize=5")
        .set("Cookie", [`toktickit_session=${staffToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.pagination.limit ?? res.body.pagination.pageSize).toBe(5);
    });

    it("restricts Requesters to only their owned tickets", async () => {
      const res = await request(app)
        .get("/api/tickets")
        .set("Cookie", [`toktickit_session=${requesterToken}`]);

      expect(res.status).toBe(200);
      for (const t of res.body.data) {
        expect(t.requesterId ?? t.requester?.id).toBe(requesterId);
      }
    });
  });
});
