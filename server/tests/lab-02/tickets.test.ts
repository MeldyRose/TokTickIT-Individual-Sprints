import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import bcrypt from "bcryptjs";

describe("Ticket API Endpoints (Issue 4 & 16)", () => {
  let requesterAToken = "";
  let requesterAId = "";
  let requesterBToken = "";
  let requesterBId = "";
  let categoryId = "";
  let relatedSystemId = "";

  beforeEach(async () => {
    const pwdHash = bcrypt.hashSync("Password123!", 10);

    let userA = await getPrisma().user.findUnique({ where: { email: "jennifer.lab2@toktickit.com" } });
    if (!userA) {
      userA = await getPrisma().user.create({
        data: {
          name: "Jennifer Lab2",
          email: "jennifer.lab2@toktickit.com",
          passwordHash: pwdHash,
          role: "REQUESTER",
          isActive: true,
          mustChangePassword: false,
        },
      });
    }
    requesterAId = userA.id;

    let userB = await getPrisma().user.findUnique({ where: { email: "michael.lab2@toktickit.com" } });
    if (!userB) {
      userB = await getPrisma().user.create({
        data: {
          name: "Michael Lab2",
          email: "michael.lab2@toktickit.com",
          passwordHash: pwdHash,
          role: "REQUESTER",
          isActive: true,
          mustChangePassword: false,
        },
      });
    }
    requesterBId = userB.id;

    // Login Requester A
    const loginA = await request(app)
      .post("/api/auth/login")
      .send({ email: "jennifer.lab2@toktickit.com", password: "Password123!" });
    const cookieA = loginA.headers["set-cookie"];
    if (cookieA) {
      const match = cookieA[0].match(/toktickit_session=([^;]+)/);
      if (match) requesterAToken = match[1];
    }

    // Login Requester B
    const loginB = await request(app)
      .post("/api/auth/login")
      .send({ email: "michael.lab2@toktickit.com", password: "Password123!" });
    const cookieB = loginB.headers["set-cookie"];
    if (cookieB) {
      const match = cookieB[0].match(/toktickit_session=([^;]+)/);
      if (match) requesterBToken = match[1];
    }

    const catRes = await request(app).get("/api/categories");
    if (catRes.body.length > 0) categoryId = catRes.body[0].id;

    const sysRes = await request(app).get("/api/related-systems");
    if (sysRes.body.length > 0) relatedSystemId = sysRes.body[0].id;
  });

  describe("POST /api/tickets (API-01, AC-01, BR-01, BR-06)", () => {
    it("returns 401 Unauthorized when session authentication is missing", async () => {
      const res = await request(app).post("/api/tickets").send({
        summary: "Laptop battery issue",
        categoryId,
        relatedSystemId,
      });
      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/Unauthorized/i);
    });

    it("returns 400 Bad Request when mandatory fields are missing", async () => {
      const res = await request(app)
        .post("/api/tickets")
        .set("Cookie", [`toktickit_session=${requesterAToken}`])
        .send({
          summary: "",
          categoryId,
          relatedSystemId,
        });
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it("creates a ticket and returns 201 Created with official Ticket Number", async () => {
      const res = await request(app)
        .post("/api/tickets")
        .set("Cookie", [`toktickit_session=${requesterAToken}`])
        .send({
          summary: "Wi-Fi connection drops in Lab 3",
          description: "Experiencing frequent disconnects on the campus Wi-Fi network.",
          categoryId,
          relatedSystemId,
          requestedPriority: "HIGH",
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("id");
      expect(res.body).toHaveProperty("ticketNumber");
      expect(res.body.ticketNumber).toMatch(/^TKT-\d{4}-\d{6}$/);
      expect(res.body.summary).toBe("Wi-Fi connection drops in Lab 3");
      expect(res.body.currentStatus).toBe("NEW");
      expect(res.body.requestedPriority).toBe("HIGH");
      expect(res.body.requesterId).toBe(requesterAId);
    });
  });

  describe("GET /api/tickets (API-02, API-04, AC-04, AC-05, AC-06)", () => {
    it("returns 401 Unauthorized when session authentication is missing", async () => {
      const res = await request(app).get("/api/tickets");
      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/Unauthorized/i);
    });

    it("returns paginated tickets belonging strictly to authenticated session user (AC-04)", async () => {
      await request(app)
        .post("/api/tickets")
        .set("Cookie", [`toktickit_session=${requesterAToken}`])
        .send({
          summary: "Requester A Ticket Unique Test",
          categoryId,
          relatedSystemId,
        });

      const resA = await request(app)
        .get("/api/tickets")
        .set("Cookie", [`toktickit_session=${requesterAToken}`]);

      expect(resA.status).toBe(200);
      expect(resA.body).toHaveProperty("data");
      expect(resA.body).toHaveProperty("pagination");
      expect(Array.isArray(resA.body.data)).toBe(true);

      const summariesA = resA.body.data.map((t: { summary: string }) => t.summary);
      expect(summariesA).toContain("Requester A Ticket Unique Test");

      const resB = await request(app)
        .get("/api/tickets")
        .set("Cookie", [`toktickit_session=${requesterBToken}`]);

      expect(resB.status).toBe(200);
      const summariesB = resB.body.data.map((t: { summary: string }) => t.summary);
      expect(summariesB).not.toContain("Requester A Ticket Unique Test");
    });

    it("supports search, filtering, and pagination", async () => {
      const createdRes = await request(app)
        .post("/api/tickets")
        .set("Cookie", [`toktickit_session=${requesterAToken}`])
        .send({
          summary: "Printer paper jam in 4th floor office",
          categoryId,
          relatedSystemId,
        });

      const ticketNo = createdRes.body.ticketNumber;

      const searchRes = await request(app)
        .get(`/api/tickets?search=${ticketNo}`)
        .set("Cookie", [`toktickit_session=${requesterAToken}`]);

      expect(searchRes.status).toBe(200);
      expect(searchRes.body.data.length).toBeGreaterThan(0);
      expect(searchRes.body.data[0].ticketNumber).toBe(ticketNo);
    });
  });
});
