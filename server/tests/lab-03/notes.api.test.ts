import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import bcrypt from "bcryptjs";

describe("Internal Notes RBAC Security API Tests (notes.api.test.ts - Issue 19, AC-04, AC-11)", () => {
  let staffToken = "";
  let adminToken = "";
  let requesterToken = "";
  let ticketId = "";

  beforeEach(async () => {
    const passwordHash = bcrypt.hashSync("Password123!", 10);

    // Create IT Staff user
    let staffUser = await getPrisma().user.findUnique({ where: { email: "staff.notes19@toktickit.com" } });
    if (!staffUser) {
      staffUser = await getPrisma().user.create({
        data: {
          name: "Staff Notes19",
          email: "staff.notes19@toktickit.com",
          passwordHash,
          role: "IT_STAFF",
          isActive: true,
          mustChangePassword: false,
        },
      });
    }

    // Create Admin user
    let adminUser = await getPrisma().user.findUnique({ where: { email: "admin.notes19@toktickit.com" } });
    if (!adminUser) {
      adminUser = await getPrisma().user.create({
        data: {
          name: "Admin Notes19",
          email: "admin.notes19@toktickit.com",
          passwordHash,
          role: "ADMINISTRATOR",
          isActive: true,
          mustChangePassword: false,
        },
      });
    }

    // Create Requester user
    let reqUser = await getPrisma().user.findUnique({ where: { email: "req.notes19@toktickit.com" } });
    if (!reqUser) {
      reqUser = await getPrisma().user.create({
        data: {
          name: "Req Notes19",
          email: "req.notes19@toktickit.com",
          passwordHash,
          role: "REQUESTER",
          isActive: true,
          mustChangePassword: false,
        },
      });
    }

    // Login Staff
    const loginStaff = await request(app)
      .post("/api/auth/login")
      .send({ email: "staff.notes19@toktickit.com", password: "Password123!" });
    const cookiesStaff = loginStaff.headers["set-cookie"];
    if (cookiesStaff) {
      const match = cookiesStaff[0].match(/toktickit_session=([^;]+)/);
      if (match) staffToken = match[1];
    }

    // Login Admin
    const loginAdmin = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin.notes19@toktickit.com", password: "Password123!" });
    const cookiesAdmin = loginAdmin.headers["set-cookie"];
    if (cookiesAdmin) {
      const match = cookiesAdmin[0].match(/toktickit_session=([^;]+)/);
      if (match) adminToken = match[1];
    }

    // Login Requester
    const loginReq = await request(app)
      .post("/api/auth/login")
      .send({ email: "req.notes19@toktickit.com", password: "Password123!" });
    const cookiesReq = loginReq.headers["set-cookie"];
    if (cookiesReq) {
      const match = cookiesReq[0].match(/toktickit_session=([^;]+)/);
      if (match) requesterToken = match[1];
    }

    // Ensure category and related system
    let category = await getPrisma().category.findFirst({ where: { isActive: true } });
    if (!category) {
      category = await getPrisma().category.create({
        data: { name: "Test Category 19", description: "Category for issue 19 test" },
      });
    }

    let system = await getPrisma().relatedSystem.findFirst({ where: { isActive: true } });
    if (!system) {
      system = await getPrisma().relatedSystem.create({
        data: { name: "Test System 19", description: "System for issue 19 test" },
      });
    }

    // Create a test ticket owned by Requester
    const ticket = await getPrisma().ticket.create({
      data: {
        ticketNumber: `TKT-NOTE19-${Date.now()}`,
        summary: "Test Ticket for Notes Security",
        description: "Testing role restricted internal notes access",
        categoryId: category.id,
        relatedSystemId: system.id,
        requesterId: reqUser.id,
      },
    });
    ticketId = ticket.id;
  });

  it("returns 401 Unauthorized for GET /api/tickets/:id/notes when unauthenticated", async () => {
    const res = await request(app).get(`/api/tickets/${ticketId}/notes`);
    expect(res.status).toBe(401);
  });

  it("returns 403 Forbidden for GET /api/tickets/:id/notes when requested by Requester (AC-04, BR-04)", async () => {
    const res = await request(app)
      .get(`/api/tickets/${ticketId}/notes`)
      .set("Cookie", [`toktickit_session=${requesterToken}`]);

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/Forbidden|restricted/i);
  });

  it("returns 403 Forbidden for POST /api/tickets/:id/notes when requested by Requester (AC-04, BR-04)", async () => {
    const res = await request(app)
      .post(`/api/tickets/${ticketId}/notes`)
      .set("Cookie", [`toktickit_session=${requesterToken}`])
      .send({ content: "Unauthorized attempt by Requester" });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/Forbidden|restricted/i);
  });

  it("allows IT Staff to post and view internal notes (AC-11)", async () => {
    // Post note as Staff
    const postRes = await request(app)
      .post(`/api/tickets/${ticketId}/notes`)
      .set("Cookie", [`toktickit_session=${staffToken}`])
      .send({ content: "Internal diagnostic note by staff" });

    expect(postRes.status).toBe(201);
    expect(postRes.body.content).toBe("Internal diagnostic note by staff");
    expect(postRes.body.author.name).toBe("Staff Notes19");

    // Fetch notes as Staff
    const getRes = await request(app)
      .get(`/api/tickets/${ticketId}/notes`)
      .set("Cookie", [`toktickit_session=${staffToken}`]);

    expect(getRes.status).toBe(200);
    expect(Array.isArray(getRes.body)).toBe(true);
    expect(getRes.body.length).toBeGreaterThanOrEqual(1);
    expect(getRes.body.some((n: any) => n.content === "Internal diagnostic note by staff")).toBe(true);
  });

  it("allows Administrator to post and view internal notes (AC-11)", async () => {
    // Post note as Admin
    const postRes = await request(app)
      .post(`/api/tickets/${ticketId}/notes`)
      .set("Cookie", [`toktickit_session=${adminToken}`])
      .send({ content: "Admin note for internal audit" });

    expect(postRes.status).toBe(201);
    expect(postRes.body.content).toBe("Admin note for internal audit");
    expect(postRes.body.author.name).toBe("Admin Notes19");

    // Fetch notes as Admin
    const getRes = await request(app)
      .get(`/api/tickets/${ticketId}/notes`)
      .set("Cookie", [`toktickit_session=${adminToken}`]);

    expect(getRes.status).toBe(200);
    expect(getRes.body.some((n: any) => n.content === "Admin note for internal audit")).toBe(true);
  });
});
