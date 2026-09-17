import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import bcrypt from "bcryptjs";

describe("GET /api/tickets/:id (EP-06, API-03, AC-03, FR-06, FR-07, BR-05)", () => {
  let requesterAToken = "";
  let requesterAId = "";
  let requesterBToken = "";
  let requesterBId = "";
  let categoryId = "";
  let relatedSystemId = "";
  let ticketIdA = "";

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
    if (catRes.body.length > 0) {
      categoryId = catRes.body[0].id;
    }

    const sysRes = await request(app).get("/api/related-systems");
    if (sysRes.body.length > 0) {
      relatedSystemId = sysRes.body[0].id;
    }

    // Create a ticket owned by Requester A
    const ticketRes = await request(app)
      .post("/api/tickets")
      .set("Cookie", `toktickit_session=${requesterAToken}`)
      .send({
        summary: "Issue 5 Ticket Detail Isolation Test",
        description: "Testing ticket detail endpoint and cross-requester protection.",
        categoryId,
        relatedSystemId,
        requestedPriority: "HIGH",
      });

    ticketIdA = ticketRes.body.id;
  });

  it("returns 401 Unauthorized when session is missing", async () => {
    const res = await request(app).get(`/api/tickets/${ticketIdA}`);
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/Unauthorized/i);
  });

  it("returns 200 OK with full ticket details when requested by ticket owner", async () => {
    const res = await request(app)
      .get(`/api/tickets/${ticketIdA}`)
      .set("Cookie", `toktickit_session=${requesterAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(ticketIdA);
    expect(res.body.summary).toBe("Issue 5 Ticket Detail Isolation Test");
    expect(res.body.description).toBe("Testing ticket detail endpoint and cross-requester protection.");
    expect(res.body).toHaveProperty("ticketNumber");
    expect(res.body).toHaveProperty("category");
    expect(res.body).toHaveProperty("relatedSystem");
    expect(res.body).toHaveProperty("requester");
    expect(res.body).toHaveProperty("attachments");
  });

  it("returns 403 Forbidden or 404 Not Found when Requester B attempts access (Ownership Protection)", async () => {
    const res = await request(app)
      .get(`/api/tickets/${ticketIdA}`)
      .set("Cookie", `toktickit_session=${requesterBToken}`);

    expect([403, 404]).toContain(res.status);
    expect(res.body.error).toMatch(/Ticket not found or access denied/i);
  });
});
