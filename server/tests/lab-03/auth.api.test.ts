import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import bcrypt from "bcryptjs";

describe("Authentication & Password Management API (Issue 14)", () => {
  const activeEmail = "jennifer.a@example.com";
  const inactiveEmail = "inactive@example.com";
  const defaultPassword = "Password123!";

  beforeEach(async () => {
    // Reset passwords for test accounts in database before each test
    const defaultHash = bcrypt.hashSync(defaultPassword, 10);
    await getPrisma().user.updateMany({
      where: { email: { in: [activeEmail, inactiveEmail] } },
      data: {
        passwordHash: defaultHash,
        mustChangePassword: true,
      },
    });
  });

  describe("Security Headers (BR-08)", () => {
    it("returns Cache-Control: no-store on login endpoint", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: activeEmail, password: defaultPassword });

      expect(res.headers["cache-control"]).toMatch(/no-store/i);
    });

    it("returns Cache-Control: no-store on me endpoint", async () => {
      const res = await request(app).get("/api/auth/me");
      expect(res.headers["cache-control"]).toMatch(/no-store/i);
    });
  });

  describe("POST /api/auth/login (AC-01, AC-16, BR-01, BR-08)", () => {
    it("authenticates valid credentials successfully (200 OK) and sets HTTP-only session cookie", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: activeEmail, password: defaultPassword });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("user");
      expect(res.body.user).toHaveProperty("id");
      expect(res.body.user.email).toBe(activeEmail);
      expect(res.body.user).toHaveProperty("role");
      expect(res.body.user).toHaveProperty("mustChangePassword");

      // Verify Set-Cookie header contains HttpOnly session cookie
      const cookies = res.headers["set-cookie"];
      expect(cookies).toBeDefined();
      const cookieStr = Array.isArray(cookies) ? cookies.join("; ") : cookies;
      expect(cookieStr).toMatch(/httponly/i);
      expect(cookieStr).toMatch(/(toktickit_session|session_token)=/i);
    });

    it("returns generic 401 Unauthorized for invalid password without revealing state", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: activeEmail, password: "WrongPassword123!" });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("error");
      expect(res.body.error).toMatch(/invalid/i);
    });

    it("returns generic 401 Unauthorized for non-existent email", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "nonexistent.user@example.com", password: defaultPassword });

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/invalid/i);
    });

    it("rejects inactive user login with generic 401 Unauthorized (AC-16, BR-01)", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: inactiveEmail, password: defaultPassword });

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/invalid/i);
    });
  });

  describe("GET /api/auth/me", () => {
    it("returns 401 Unauthorized for unauthenticated requests", async () => {
      const res = await request(app).get("/api/auth/me");
      expect(res.status).toBe(401);
    });

    it("returns user context for valid authenticated session", async () => {
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({ email: activeEmail, password: defaultPassword });

      const cookie = loginRes.headers["set-cookie"];

      const meRes = await request(app)
        .get("/api/auth/me")
        .set("Cookie", cookie);

      expect(meRes.status).toBe(200);
      expect(meRes.body.user.email).toBe(activeEmail);
      expect(meRes.body.user).toHaveProperty("role");
      expect(meRes.body.user).toHaveProperty("mustChangePassword");
    });
  });

  describe("POST /api/auth/change-password (AC-02, BR-02, BR-07)", () => {
    it("rejects password change if unauthenticated", async () => {
      const res = await request(app)
        .post("/api/auth/change-password")
        .send({
          currentPassword: defaultPassword,
          newPassword: "NewValidPassword123!",
        });

      expect(res.status).toBe(401);
    });

    it("rejects password change if current password is wrong", async () => {
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({ email: activeEmail, password: defaultPassword });

      const cookie = loginRes.headers["set-cookie"];

      const res = await request(app)
        .post("/api/auth/change-password")
        .set("Cookie", cookie)
        .send({
          currentPassword: "IncorrectPassword123!",
          newPassword: "NewValidPassword123!",
        });

      expect(res.status).toBe(401);
    });

    it("rejects weak new passwords failing complexity rules (min 8, upper, lower, number, special)", async () => {
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({ email: activeEmail, password: defaultPassword });

      const cookie = loginRes.headers["set-cookie"];

      // 1. Too short
      const shortRes = await request(app)
        .post("/api/auth/change-password")
        .set("Cookie", cookie)
        .send({
          currentPassword: defaultPassword,
          newPassword: "Short1!",
        });
      expect(shortRes.status).toBe(400);

      // 2. Missing special character
      const noSpecialRes = await request(app)
        .post("/api/auth/change-password")
        .set("Cookie", cookie)
        .send({
          currentPassword: defaultPassword,
          newPassword: "NoSpecialChar123",
        });
      expect(noSpecialRes.status).toBe(400);

      // 3. Missing uppercase letter
      const noUpperRes = await request(app)
        .post("/api/auth/change-password")
        .set("Cookie", cookie)
        .send({
          currentPassword: defaultPassword,
          newPassword: "lowercase123!",
        });
      expect(noUpperRes.status).toBe(400);
    });

    it("updates password hash with salt 10 and sets mustChangePassword = false for valid request (AC-02)", async () => {
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({ email: activeEmail, password: defaultPassword });

      const cookie = loginRes.headers["set-cookie"];
      const newPassword = "BrandNewPassword123!";

      const changeRes = await request(app)
        .post("/api/auth/change-password")
        .set("Cookie", cookie)
        .send({
          currentPassword: defaultPassword,
          newPassword,
          confirmNewPassword: newPassword,
        });

      expect(changeRes.status).toBe(200);
      expect(changeRes.body.mustChangePassword).toBe(false);

      // Verify old password no longer works
      const oldLoginRes = await request(app)
        .post("/api/auth/login")
        .send({ email: activeEmail, password: defaultPassword });
      expect(oldLoginRes.status).toBe(401);

      // Verify new password authenticates successfully
      const newLoginRes = await request(app)
        .post("/api/auth/login")
        .send({ email: activeEmail, password: newPassword });
      expect(newLoginRes.status).toBe(200);
      expect(newLoginRes.body.user.mustChangePassword).toBe(false);
    });
  });

  describe("POST /api/auth/logout (AC-17)", () => {
    it("invalidates session token and revokes subsequent API access", async () => {
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({ email: activeEmail, password: defaultPassword });

      const cookie = loginRes.headers["set-cookie"];

      // Verify session works before logout
      const meBefore = await request(app)
        .get("/api/auth/me")
        .set("Cookie", cookie);
      expect(meBefore.status).toBe(200);

      // Logout
      const logoutRes = await request(app)
        .post("/api/auth/logout")
        .set("Cookie", cookie);

      expect(logoutRes.status).toBe(200);

      // Verify session is revoked after logout
      const meAfter = await request(app)
        .get("/api/auth/me")
        .set("Cookie", cookie);
      expect(meAfter.status).toBe(401);
    });
  });
});
