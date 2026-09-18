import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import bcrypt from "bcryptjs";

describe("Public Comments & Internal Notes Validation API Tests (comments-notes.api.test.ts - Issue 19, BR-15, BR-16)", () => {
  let staffToken = "";
  let requesterToken = "";
  let ticketId = "";

  beforeEach(async () => {
    const passwordHash = bcrypt.hashSync("Password123!", 10);

    // Upsert Staff User
    const staffUser = await getPrisma().user.upsert({
      where: { email: "staff.cn19@toktickit.com" },
      update: {},
      create: {
        name: "Staff CN19",
        email: "staff.cn19@toktickit.com",
        passwordHash,
        role: "IT_STAFF",
        isActive: true,
        mustChangePassword: false,
      },
    });

    // Upsert Requester User
    const reqUser = await getPrisma().user.upsert({
      where: { email: "req.cn19@toktickit.com" },
      update: {},
      create: {
        name: "Req CN19",
        email: "req.cn19@toktickit.com",
        passwordHash,
        role: "REQUESTER",
        isActive: true,
        mustChangePassword: false,
      },
    });

    // Login Staff
    const loginStaff = await request(app)
      .post("/api/auth/login")
      .send({ email: "staff.cn19@toktickit.com", password: "Password123!" });
    const cookiesStaff = loginStaff.headers["set-cookie"];
    if (cookiesStaff) {
      const match = cookiesStaff[0].match(/toktickit_session=([^;]+)/);
      if (match) staffToken = match[1];
    }

    // Login Requester
    const loginReq = await request(app)
      .post("/api/auth/login")
      .send({ email: "req.cn19@toktickit.com", password: "Password123!" });
    const cookiesReq = loginReq.headers["set-cookie"];
    if (cookiesReq) {
      const match = cookiesReq[0].match(/toktickit_session=([^;]+)/);
      if (match) requesterToken = match[1];
    }

    let category = await getPrisma().category.findFirst({ where: { isActive: true } });
    if (!category) {
      category = await getPrisma().category.create({
        data: { name: "Category CN19", description: "Category description" },
      });
    }

    let system = await getPrisma().relatedSystem.findFirst({ where: { isActive: true } });
    if (!system) {
      system = await getPrisma().relatedSystem.create({
        data: { name: "System CN19", description: "System description" },
      });
    }

    const ticket = await getPrisma().ticket.create({
      data: {
        ticketNumber: `TKT-CN19-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        summary: "Comments and Notes Validation Ticket",
        description: "Testing payload validation limits for comments and notes",
        categoryId: category.id,
        relatedSystemId: system.id,
        requesterId: reqUser.id,
      },
    });
    ticketId = ticket.id;
  });

  describe("Public Comments Validation (BR-16)", () => {
    it("rejects empty or whitespace-only comment content with 400 Bad Request", async () => {
      const resEmpty = await request(app)
        .post(`/api/tickets/${ticketId}/comments`)
        .set("Cookie", [`toktickit_session=${requesterToken}`])
        .send({ content: "" });

      expect(resEmpty.status).toBe(400);

      const resWhitespace = await request(app)
        .post(`/api/tickets/${ticketId}/comments`)
        .set("Cookie", [`toktickit_session=${requesterToken}`])
        .send({ content: "    \n   " });

      expect(resWhitespace.status).toBe(400);
    });

    it("rejects comment content exceeding 2,000 characters with 400 Bad Request", async () => {
      const overLongContent = "a".repeat(2001);
      const res = await request(app)
        .post(`/api/tickets/${ticketId}/comments`)
        .set("Cookie", [`toktickit_session=${requesterToken}`])
        .send({ content: overLongContent });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/2,000 characters/i);
    });

    it("accepts valid comment content between 1 and 2,000 characters (AC-10)", async () => {
      const validContent = "This is a valid public comment thread message.";
      const res = await request(app)
        .post(`/api/tickets/${ticketId}/comments`)
        .set("Cookie", [`toktickit_session=${requesterToken}`])
        .send({ content: validContent });

      expect(res.status).toBe(201);
      expect(res.body.content).toBe(validContent);
      expect(res.body.author.name).toBe("Req CN19");
    });
  });

  describe("Internal Notes Validation (BR-16)", () => {
    it("rejects empty or whitespace-only note content with 400 Bad Request", async () => {
      const resEmpty = await request(app)
        .post(`/api/tickets/${ticketId}/notes`)
        .set("Cookie", [`toktickit_session=${staffToken}`])
        .send({ content: "" });

      expect(resEmpty.status).toBe(400);

      const resWhitespace = await request(app)
        .post(`/api/tickets/${ticketId}/notes`)
        .set("Cookie", [`toktickit_session=${staffToken}`])
        .send({ content: "   \t  " });

      expect(resWhitespace.status).toBe(400);
    });

    it("rejects note content exceeding 2,000 characters with 400 Bad Request", async () => {
      const overLongContent = "b".repeat(2001);
      const res = await request(app)
        .post(`/api/tickets/${ticketId}/notes`)
        .set("Cookie", [`toktickit_session=${staffToken}`])
        .send({ content: overLongContent });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/2,000 characters/i);
    });

    it("accepts valid note content between 1 and 2,000 characters for IT Staff (AC-11)", async () => {
      const validNote = "Note details logged for internal team review.";
      const res = await request(app)
        .post(`/api/tickets/${ticketId}/notes`)
        .set("Cookie", [`toktickit_session=${staffToken}`])
        .send({ content: validNote });

      expect(res.status).toBe(201);
      expect(res.body.content).toBe(validNote);
      expect(res.body.author.name).toBe("Staff CN19");
    });
  });
});
