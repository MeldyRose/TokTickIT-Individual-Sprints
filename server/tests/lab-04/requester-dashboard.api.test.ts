import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import bcrypt from "bcryptjs";
import { Role, TicketStatus } from "@prisma/client";

describe("Lab 4: Requester Dashboard API (requester-dashboard.api.test.ts)", () => {
  const prisma = getPrisma();

  let requesterA: any;
  let tokenA = "";

  let requesterB: any;
  let tokenB = "";

  let emptyRequester: any;
  let emptyRequesterToken = "";

  let staffUser: any;
  let staffToken = "";

  let adminUser: any;
  let adminToken = "";

  let testCategory: any;
  let testSystem: any;

  beforeAll(async () => {
    const passwordHash = bcrypt.hashSync("Password123!", 10);

    // 1. Setup users once in beforeAll to prevent concurrency interference across parallel suites
    requesterA = await prisma.user.upsert({
      where: { email: "requester.a.dash@toktickit.com" },
      update: { role: Role.REQUESTER, isActive: true, mustChangePassword: false, passwordHash },
      create: {
        name: "Requester Alpha",
        email: "requester.a.dash@toktickit.com",
        role: Role.REQUESTER,
        isActive: true,
        mustChangePassword: false,
        passwordHash,
      },
    });

    requesterB = await prisma.user.upsert({
      where: { email: "requester.b.dash@toktickit.com" },
      update: { role: Role.REQUESTER, isActive: true, mustChangePassword: false, passwordHash },
      create: {
        name: "Requester Beta",
        email: "requester.b.dash@toktickit.com",
        role: Role.REQUESTER,
        isActive: true,
        mustChangePassword: false,
        passwordHash,
      },
    });

    emptyRequester = await prisma.user.upsert({
      where: { email: "requester.empty.dash@toktickit.com" },
      update: { role: Role.REQUESTER, isActive: true, mustChangePassword: false, passwordHash },
      create: {
        name: "Requester Empty",
        email: "requester.empty.dash@toktickit.com",
        role: Role.REQUESTER,
        isActive: true,
        mustChangePassword: false,
        passwordHash,
      },
    });

    staffUser = await prisma.user.upsert({
      where: { email: "staff.dash.test@toktickit.com" },
      update: { role: Role.IT_STAFF, isActive: true, mustChangePassword: false, passwordHash },
      create: {
        name: "Staff Dash Tester",
        email: "staff.dash.test@toktickit.com",
        role: Role.IT_STAFF,
        isActive: true,
        mustChangePassword: false,
        passwordHash,
      },
    });

    adminUser = await prisma.user.upsert({
      where: { email: "admin.dash.test@toktickit.com" },
      update: { role: Role.ADMINISTRATOR, isActive: true, mustChangePassword: false, passwordHash },
      create: {
        name: "Admin Dash Tester",
        email: "admin.dash.test@toktickit.com",
        role: Role.ADMINISTRATOR,
        isActive: true,
        mustChangePassword: false,
        passwordHash,
      },
    });

    // 2. Fetch category and system
    testCategory = await prisma.category.findFirst({ where: { isActive: true } });
    testSystem = await prisma.relatedSystem.findFirst({ where: { isActive: true } });

    // 3. Authenticate users once in beforeAll
    const loginA = await request(app)
      .post("/api/auth/login")
      .send({ email: "requester.a.dash@toktickit.com", password: "Password123!" });
    tokenA = loginA.headers["set-cookie"]?.[0]?.split(";")[0]?.split("=")[1] || "";

    const loginB = await request(app)
      .post("/api/auth/login")
      .send({ email: "requester.b.dash@toktickit.com", password: "Password123!" });
    tokenB = loginB.headers["set-cookie"]?.[0]?.split(";")[0]?.split("=")[1] || "";

    const loginEmpty = await request(app)
      .post("/api/auth/login")
      .send({ email: "requester.empty.dash@toktickit.com", password: "Password123!" });
    emptyRequesterToken = loginEmpty.headers["set-cookie"]?.[0]?.split(";")[0]?.split("=")[1] || "";

    const loginStaff = await request(app)
      .post("/api/auth/login")
      .send({ email: "staff.dash.test@toktickit.com", password: "Password123!" });
    staffToken = loginStaff.headers["set-cookie"]?.[0]?.split(";")[0]?.split("=")[1] || "";

    const loginAdmin = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin.dash.test@toktickit.com", password: "Password123!" });
    adminToken = loginAdmin.headers["set-cookie"]?.[0]?.split(";")[0]?.split("=")[1] || "";
  });

  afterAll(async () => {
    // Clean up created tickets and users to ensure clean state
    await prisma.ticket.deleteMany({
      where: {
        requesterId: { in: [requesterA.id, requesterB.id, emptyRequester.id] },
      },
    });
    await prisma.user.deleteMany({
      where: {
        id: { in: [requesterA.id, requesterB.id, emptyRequester.id, staffUser.id, adminUser.id] },
      },
    });
  });

  beforeEach(async () => {
    // Clean up only our suite's tickets between tests
    await prisma.ticket.deleteMany({
      where: {
        requesterId: { in: [requesterA.id, requesterB.id, emptyRequester.id] },
      },
    });
  });

  describe("1. Authentication & Role-Based Authorization", () => {
    it("rejects unauthenticated request with 401 Unauthorized", async () => {
      const res = await request(app).get("/api/dashboard/requester");
      expect(res.status).toBe(401);
      expect(res.body.error?.code).toBe("UNAUTHORIZED");
    });

    it("rejects IT_STAFF accessing requester dashboard with 403 Forbidden", async () => {
      const res = await request(app)
        .get("/api/dashboard/requester")
        .set("Cookie", `toktickit_session=${staffToken}`);
      expect(res.status).toBe(403);
      expect(res.body.error?.code).toBe("FORBIDDEN");
    });

    it("rejects ADMINISTRATOR accessing requester dashboard with 403 Forbidden", async () => {
      const res = await request(app)
        .get("/api/dashboard/requester")
        .set("Cookie", `toktickit_session=${adminToken}`);
      expect(res.status).toBe(403);
      expect(res.body.error?.code).toBe("FORBIDDEN");
    });

    it("allows authenticated REQUESTER with 200 OK", async () => {
      const res = await request(app)
        .get("/api/dashboard/requester")
        .set("Cookie", `toktickit_session=${tokenA}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("metrics");
      expect(res.body).toHaveProperty("recentTickets");
    });
  });

  describe("2. Strict Scoping & Zero Cross-User Leakage", () => {
    it("strictly scopes metric calculations to the authenticated requester without leakage", async () => {
      // Seed 2 active tickets and 1 resolved ticket for Requester A
      await prisma.ticket.create({
        data: {
          ticketNumber: "TCK-REQ-A1",
          summary: "Requester A Ticket 1 - Open",
          description: "Detail description for ticket A1",
          categoryId: testCategory.id,
          relatedSystemId: testSystem.id,
          requesterId: requesterA.id,
          currentStatus: TicketStatus.OPEN,
        },
      });

      await prisma.ticket.create({
        data: {
          ticketNumber: "TCK-REQ-A2",
          summary: "Requester A Ticket 2 - Waiting",
          description: "Detail description for ticket A2",
          categoryId: testCategory.id,
          relatedSystemId: testSystem.id,
          requesterId: requesterA.id,
          currentStatus: TicketStatus.WAITING_FOR_REQUESTER,
        },
      });

      await prisma.ticket.create({
        data: {
          ticketNumber: "TCK-REQ-A3",
          summary: "Requester A Ticket 3 - Resolved",
          description: "Detail description for ticket A3",
          categoryId: testCategory.id,
          relatedSystemId: testSystem.id,
          requesterId: requesterA.id,
          currentStatus: TicketStatus.RESOLVED,
          resolvedAt: new Date(),
          resolutionSummary: "Resolved issue cleanly with documented steps",
        },
      });

      // Seed 5 tickets for Requester B (including 3 waiting for requester)
      for (let i = 1; i <= 5; i++) {
        await prisma.ticket.create({
          data: {
            ticketNumber: `TCK-REQ-B${i}`,
            summary: `Requester B Ticket ${i}`,
            description: "Detail description for ticket B",
            categoryId: testCategory.id,
            relatedSystemId: testSystem.id,
            requesterId: requesterB.id,
            currentStatus: i <= 3 ? TicketStatus.WAITING_FOR_REQUESTER : TicketStatus.OPEN,
          },
        });
      }

      // Fetch Requester A dashboard
      const resA = await request(app)
        .get("/api/dashboard/requester")
        .set("Cookie", `toktickit_session=${tokenA}`);

      expect(resA.status).toBe(200);
      // Total open for A must be exactly 2 (A1 + A2), ignoring all 5 of B's tickets
      expect(resA.body.metrics.totalOpen).toBe(2);
      expect(resA.body.metrics.totalActive).toBe(2);
      // Waiting for Requester for A must be exactly 1 (A2), ignoring B's 3 waiting tickets
      expect(resA.body.metrics.waitingForRequester).toBe(1);
      expect(resA.body.metrics.waitingForMyInput).toBe(1);
      // Recently resolved for A must be exactly 1 (A3)
      expect(resA.body.metrics.recentlyResolved).toBe(1);
      expect(resA.body.metrics.resolvedRecently).toBe(1);

      // Verify recent tickets strictly contain Requester A's tickets
      const ticketNumbersA = resA.body.recentTickets.map((t: any) => t.ticketNumber);
      expect(ticketNumbersA).toContain("TCK-REQ-A1");
      expect(ticketNumbersA).toContain("TCK-REQ-A2");
      expect(ticketNumbersA).toContain("TCK-REQ-A3");
      expect(ticketNumbersA.some((num: string) => num.startsWith("TCK-REQ-B"))).toBe(false);

      // Fetch Requester B dashboard
      const resB = await request(app)
        .get("/api/dashboard/requester")
        .set("Cookie", `toktickit_session=${tokenB}`);

      expect(resB.status).toBe(200);
      expect(resB.body.metrics.totalOpen).toBe(5);
      expect(resB.body.metrics.waitingForRequester).toBe(3);
      expect(resB.body.metrics.recentlyResolved).toBe(0);
      const ticketNumbersB = resB.body.recentTickets.map((t: any) => t.ticketNumber);
      expect(ticketNumbersB.some((num: string) => num.startsWith("TCK-REQ-A"))).toBe(false);
    });
  });

  describe("3. Authoritative Metric Calculations & Active Status Rules", () => {
    it("correctly includes active statuses, excludes terminal/cancelled statuses, and strictly counts resolvedAt within 7 days (BR-20)", async () => {
      // Create one of each status for Requester A
      const statusesToTest = [
        TicketStatus.NEW,
        TicketStatus.OPEN,
        TicketStatus.IN_PROGRESS,
        TicketStatus.WAITING_FOR_REQUESTER,
        TicketStatus.REOPENED,
        TicketStatus.RESOLVED, // resolved today -> counted in recentlyResolved
        TicketStatus.CLOSED,   // resolved 30 days ago and closed yesterday -> must NOT be counted in recentlyResolved
        TicketStatus.CANCELLED,
      ];

      for (let i = 0; i < statusesToTest.length; i++) {
        const st = statusesToTest[i];
        let resolvedAt: Date | null = null;
        let closedAt: Date | null = null;

        if (st === TicketStatus.RESOLVED) {
          resolvedAt = new Date(); // today -> within 7 days
        } else if (st === TicketStatus.CLOSED) {
          resolvedAt = new Date(Date.now() - 30 * 86400 * 1000); // 30 days ago -> older than 7 days
          closedAt = new Date(); // closed yesterday/today
        }

        await prisma.ticket.create({
          data: {
            ticketNumber: `TCK-STATUS-${i}`,
            summary: `Ticket status test ${st}`,
            description: "Detail description",
            categoryId: testCategory.id,
            relatedSystemId: testSystem.id,
            requesterId: requesterA.id,
            currentStatus: st,
            resolvedAt,
            closedAt,
            resolutionSummary: st === TicketStatus.RESOLVED ? "Resolution summary for ticket" : null,
          },
        });
      }

      const res = await request(app)
        .get("/api/dashboard/requester")
        .set("Cookie", `toktickit_session=${tokenA}`);

      expect(res.status).toBe(200);
      // Active statuses: NEW, OPEN, IN_PROGRESS, WAITING_FOR_REQUESTER, REOPENED (5 active)
      expect(res.body.metrics.totalOpen).toBe(5);
      expect(res.body.metrics.waitingForRequester).toBe(1);
      // Recently resolved per BR-20: strictly resolvedAt within last 7 days (only RESOLVED ticket, NOT CLOSED with resolvedAt 30d ago)
      expect(res.body.metrics.recentlyResolved).toBe(1);
      expect(res.body.metrics.resolvedRecently).toBe(1);
    });
  });

  describe("4. Recent Tickets Summary List (Limit to 5 & Top Ordering)", () => {
    it("limits recent tickets list to top 5 ordered by updatedAt descending", async () => {
      // Create 7 tickets with staggered timestamps
      const now = Date.now();
      for (let i = 1; i <= 7; i++) {
        await prisma.ticket.create({
          data: {
            ticketNumber: `TCK-TOP-${i}`,
            summary: `Summary for top ticket ${i}`,
            description: "Detailed description",
            categoryId: testCategory.id,
            relatedSystemId: testSystem.id,
            requesterId: requesterA.id,
            currentStatus: i === 3 ? TicketStatus.WAITING_FOR_REQUESTER : TicketStatus.OPEN,
            updatedAt: new Date(now - (10 - i) * 1000), // i = 7 has most recent updatedAt
          },
        });
      }

      const res = await request(app)
        .get("/api/dashboard/requester")
        .set("Cookie", `toktickit_session=${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.recentTickets.length).toBe(5);
      // Most recent should be TCK-TOP-7
      expect(res.body.recentTickets[0].ticketNumber).toBe("TCK-TOP-7");
      // Check required fields
      const first = res.body.recentTickets[0];
      expect(first).toHaveProperty("id");
      expect(first).toHaveProperty("ticketNumber");
      expect(first).toHaveProperty("summary");
      expect(first).toHaveProperty("currentStatus");
      expect(first).toHaveProperty("actionRequired");
      expect(first).toHaveProperty("updatedAt");
      expect(first).toHaveProperty("createdAt");

      // Verify actionRequired flag logic
      const waitingTicket = res.body.recentTickets.find((t: any) => t.ticketNumber === "TCK-TOP-3");
      if (waitingTicket) {
        expect(waitingTicket.actionRequired).toBe(true);
      }
      expect(first.actionRequired).toBe(false);
    });
  });

  describe("5. Empty State Behavior (Zero Tickets)", () => {
    it("returns zero counts and empty arrays when requester has zero tickets", async () => {
      const res = await request(app)
        .get("/api/dashboard/requester")
        .set("Cookie", `toktickit_session=${emptyRequesterToken}`);

      expect(res.status).toBe(200);
      expect(res.body.metrics).toEqual({
        totalOpen: 0,
        totalActive: 0,
        waitingForRequester: 0,
        waitingForMyInput: 0,
        recentlyUpdated: 0,
        recentlyResolved: 0,
        resolvedRecently: 0,
      });
      expect(res.body.recentTickets).toEqual([]);
      expect(res.body.recentActivity).toEqual([]);
      expect(typeof res.body.calculatedAt).toBe("string");
    });
  });
});
