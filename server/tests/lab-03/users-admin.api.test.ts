import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

describe("Administrator User Management API (Issue 20)", () => {
  const adminEmail = "admin@toktickit.com";
  const staffEmail = "alex.thompson@toktickit.com";
  const requesterEmail = "sarah.j@example.com";
  const defaultPassword = "Password123!";

  let adminCookie: any;
  let staffCookie: any;
  let requesterCookie: any;

  beforeEach(async () => {
    // Reset test users to original seeded state
    const defaultHash = bcrypt.hashSync(defaultPassword, 10);
    await getPrisma().user.updateMany({
      where: { email: adminEmail },
      data: { passwordHash: defaultHash, role: Role.ADMINISTRATOR, isActive: true, mustChangePassword: false },
    });
    await getPrisma().user.updateMany({
      where: { email: staffEmail },
      data: { passwordHash: defaultHash, role: Role.IT_STAFF, isActive: true, mustChangePassword: false },
    });
    await getPrisma().user.updateMany({
      where: { email: requesterEmail },
      data: { passwordHash: defaultHash, role: Role.REQUESTER, isActive: true, mustChangePassword: false },
    });

    // Login as Admin
    const adminRes = await request(app)
      .post("/api/auth/login")
      .send({ email: adminEmail, password: defaultPassword });
    adminCookie = adminRes.headers["set-cookie"];

    // Login as IT Staff
    const staffRes = await request(app)
      .post("/api/auth/login")
      .send({ email: staffEmail, password: defaultPassword });
    staffCookie = staffRes.headers["set-cookie"];

    // Login as Requester
    const reqRes = await request(app)
      .post("/api/auth/login")
      .send({ email: requesterEmail, password: defaultPassword });
    requesterCookie = reqRes.headers["set-cookie"];
  });

  describe("GET /api/admin/users (AC-12, FR-21, FR-22)", () => {
    it("returns 401 Unauthorized for unauthenticated requests", async () => {
      const res = await request(app).get("/api/admin/users");
      expect(res.status).toBe(401);
    });

    it("returns 403 Forbidden for Requester role", async () => {
      const res = await request(app)
        .get("/api/admin/users")
        .set("Cookie", requesterCookie);
      expect(res.status).toBe(403);
    });

    it("returns 403 Forbidden for IT Staff role", async () => {
      const res = await request(app)
        .get("/api/admin/users")
        .set("Cookie", staffCookie);
      expect(res.status).toBe(403);
    });

    it("returns 200 OK with list of users for Administrator", async () => {
      const res = await request(app)
        .get("/api/admin/users")
        .set("Cookie", adminCookie);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty("id");
      expect(res.body[0]).toHaveProperty("name");
      expect(res.body[0]).toHaveProperty("email");
      expect(res.body[0]).toHaveProperty("role");
      expect(res.body[0]).toHaveProperty("isActive");
      expect(res.body[0]).toHaveProperty("mustChangePassword");
    });

    it("filters user list by search query (name or email)", async () => {
      const res = await request(app)
        .get("/api/admin/users?search=Sarah")
        .set("Cookie", adminCookie);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.every((u: any) => u.name.includes("Sarah") || u.email.includes("Sarah"))).toBe(true);
    });

    it("filters user list by role", async () => {
      const res = await request(app)
        .get("/api/admin/users?role=IT_STAFF")
        .set("Cookie", adminCookie);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.every((u: any) => u.role === "IT_STAFF")).toBe(true);
    });
  });

  describe("POST /api/admin/users (AC-13, BR-06, BR-07, BR-19)", () => {
    const testNewEmail = "new.test.user@toktickit.com";

    beforeEach(async () => {
      // Clean up test user if exists
      await getPrisma().user.deleteMany({ where: { email: testNewEmail } });
    });

    it("creates a new user account with mustChangePassword = true", async () => {
      const res = await request(app)
        .post("/api/admin/users")
        .set("Cookie", adminCookie)
        .send({
          name: "Test User New",
          email: testNewEmail,
          role: "IT_STAFF",
          isActive: true,
          initialPassword: "InitialPassword123!",
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("user");
      expect(res.body.user.email).toBe(testNewEmail);
      expect(res.body.user.role).toBe("IT_STAFF");
      expect(res.body.user.mustChangePassword).toBe(true);
      expect(res.body.user.isActive).toBe(true);
    });

    it("rejects duplicate email with 409 Conflict (BR-19)", async () => {
      const res = await request(app)
        .post("/api/admin/users")
        .set("Cookie", adminCookie)
        .send({
          name: "Duplicate Email Test",
          email: adminEmail,
          role: "REQUESTER",
          isActive: true,
          initialPassword: "InitialPassword123!",
        });

      expect(res.status).toBe(409);
      expect(res.body).toHaveProperty("error");
      expect(res.body.error).toMatch(/already exists/i);
    });

    it("rejects weak initial password with 400 Bad Request (BR-07)", async () => {
      const res = await request(app)
        .post("/api/admin/users")
        .set("Cookie", adminCookie)
        .send({
          name: "Weak Password User",
          email: "weak@toktickit.com",
          role: "REQUESTER",
          isActive: true,
          initialPassword: "123",
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error");
    });
  });

  describe("PATCH /api/admin/users/:id (AC-14, BR-17, BR-18)", () => {
    it("prevents self-deactivation of logged-in Admin account with 400 Bad Request (BR-17)", async () => {
      const adminUser = await getPrisma().user.findUnique({ where: { email: adminEmail } });
      expect(adminUser).toBeDefined();

      const res = await request(app)
        .patch(`/api/admin/users/${adminUser!.id}`)
        .set("Cookie", adminCookie)
        .send({ isActive: false });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/self-deactivation/i);
    });

    it("prevents deactivating or demoting the last active Administrator with 400 Bad Request (BR-18)", async () => {
      const currentAdmin = await getPrisma().user.findUnique({ where: { email: adminEmail } });
      expect(currentAdmin).toBeDefined();

      // Find all active admins in DB except admin@toktickit.com
      const otherActiveAdmins = await getPrisma().user.findMany({
        where: {
          role: Role.ADMINISTRATOR,
          isActive: true,
          NOT: { id: currentAdmin!.id },
        },
      });

      const otherAdminIds = otherActiveAdmins.map((a) => a.id);

      try {
        // Temporarily deactivate other active admins to make admin@toktickit.com the last active admin
        if (otherAdminIds.length > 0) {
          await getPrisma().user.updateMany({
            where: { id: { in: otherAdminIds } },
            data: { isActive: false },
          });
        }

        // Try changing role of last active admin (admin@toktickit.com) to REQUESTER
        const res = await request(app)
          .patch(`/api/admin/users/${currentAdmin!.id}`)
          .set("Cookie", adminCookie)
          .send({ role: "REQUESTER" });

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/last active administrator/i);
      } finally {
        // Always restore other active admins afterwards so test does not leak state
        if (otherAdminIds.length > 0) {
          await getPrisma().user.updateMany({
            where: { id: { in: otherAdminIds } },
            data: { isActive: true },
          });
        }
      }
    });

    it("rejects invalid role string on PATCH with 400 Bad Request", async () => {
      const targetUser = await getPrisma().user.findUnique({ where: { email: "david.l@example.com" } });
      expect(targetUser).toBeDefined();

      const res = await request(app)
        .patch(`/api/admin/users/${targetUser!.id}`)
        .set("Cookie", adminCookie)
        .send({ role: "SUPERUSER" });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/valid role is required/i);
    });

    it("edits user details successfully (200 OK)", async () => {
      const editEmail = "david.l@example.com";
      const targetUser = await getPrisma().user.findUnique({ where: { email: editEmail } });
      expect(targetUser).toBeDefined();

      const res = await request(app)
        .patch(`/api/admin/users/${targetUser!.id}`)
        .set("Cookie", adminCookie)
        .send({ name: "David Updated", role: "IT_STAFF" });

      expect(res.status).toBe(200);
      expect(res.body.user.name).toBe("David Updated");
      expect(res.body.user.role).toBe("IT_STAFF");
    });
  });

  describe("POST /api/admin/users/:id/reset-password (AC-15, BR-06)", () => {
    it("resets initial password and sets mustChangePassword = true", async () => {
      const targetUser = await getPrisma().user.findUnique({ where: { email: staffEmail } });
      expect(targetUser).toBeDefined();

      const res = await request(app)
        .post(`/api/admin/users/${targetUser!.id}/reset-password`)
        .set("Cookie", adminCookie)
        .send({ initialPassword: "NewResetPassword123!" });

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/reset successfully/i);
      expect(res.body.mustChangePassword).toBe(true);

      const updatedUser = await getPrisma().user.findUnique({ where: { id: targetUser!.id } });
      expect(updatedUser?.mustChangePassword).toBe(true);
    });
  });
});
