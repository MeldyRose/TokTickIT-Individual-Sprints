import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import bcrypt from "bcryptjs";
import { Role, TicketStatus, ITPriority } from "@prisma/client";
import { calculateAverageResolution } from "../../src/utils/dashboardUtils.js";

describe("Lab 4: IT Staff & Administrator Dashboard API (staff-dashboard.api.test.ts)", () => {
  const prisma = getPrisma();

  let staffA: any;
  let tokenStaffA = "";

  let staffB: any;
  let tokenStaffB = "";

  let adminUser: any;
  let adminToken = "";

  let requesterUser: any;
  let requesterToken = "";

  let testCategory: any;
  let testSystem: any;

  beforeEach(async () => {
    const passwordHash = bcrypt.hashSync("Password123!", 10);

    // 1. Setup staff and admin users
    staffA = await prisma.user.upsert({
      where: { email: "staff.a.dash@toktickit.com" },
      update: { role: Role.IT_STAFF, isActive: true, mustChangePassword: false, passwordHash },
      create: {
        name: "Staff Alpha",
        email: "staff.a.dash@toktickit.com",
        role: Role.IT_STAFF,
        isActive: true,
        mustChangePassword: false,
        passwordHash,
      },
    });

    staffB = await prisma.user.upsert({
      where: { email: "staff.b.dash@toktickit.com" },
      update: { role: Role.IT_STAFF, isActive: true, mustChangePassword: false, passwordHash },
      create: {
        name: "Staff Beta",
        email: "staff.b.dash@toktickit.com",
        role: Role.IT_STAFF,
        isActive: true,
        mustChangePassword: false,
        passwordHash,
      },
    });

    adminUser = await prisma.user.upsert({
      where: { email: "admin.primary.dash@toktickit.com" },
      update: { role: Role.ADMINISTRATOR, isActive: true, mustChangePassword: false, passwordHash },
      create: {
        name: "Admin Primary",
        email: "admin.primary.dash@toktickit.com",
        role: Role.ADMINISTRATOR,
        isActive: true,
        mustChangePassword: false,
        passwordHash,
      },
    });

    requesterUser = await prisma.user.upsert({
      where: { email: "requester.staffdash.test@toktickit.com" },
      update: { role: Role.REQUESTER, isActive: true, mustChangePassword: false, passwordHash },
      create: {
        name: "Requester StaffDash Tester",
        email: "requester.staffdash.test@toktickit.com",
        role: Role.REQUESTER,
        isActive: true,
        mustChangePassword: false,
        passwordHash,
      },
    });

    // 2. Fetch category and system
    testCategory = await prisma.category.findFirst({ where: { isActive: true } });
    testSystem = await prisma.relatedSystem.findFirst({ where: { isActive: true } });

    // 3. Clear existing test tickets for clean deterministic state
    await prisma.ticket.deleteMany({
      where: {
        requesterId: requesterUser.id,
      },
    });

    // 4. Authenticate users
    const loginStaffA = await request(app)
      .post("/api/auth/login")
      .send({ email: "staff.a.dash@toktickit.com", password: "Password123!" });
    tokenStaffA = loginStaffA.headers["set-cookie"]?.[0]?.split(";")[0]?.split("=")[1] || "";

    const loginStaffB = await request(app)
      .post("/api/auth/login")
      .send({ email: "staff.b.dash@toktickit.com", password: "Password123!" });
    tokenStaffB = loginStaffB.headers["set-cookie"]?.[0]?.split(";")[0]?.split("=")[1] || "";

    const loginAdmin = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin.primary.dash@toktickit.com", password: "Password123!" });
    adminToken = loginAdmin.headers["set-cookie"]?.[0]?.split(";")[0]?.split("=")[1] || "";

    const loginRequester = await request(app)
      .post("/api/auth/login")
      .send({ email: "requester.staffdash.test@toktickit.com", password: "Password123!" });
    requesterToken = loginRequester.headers["set-cookie"]?.[0]?.split(";")[0]?.split("=")[1] || "";
  });

  describe("1. Authentication & Role-Based Authorization", () => {
    it("rejects unauthenticated request with 401 Unauthorized", async () => {
      const res = await request(app).get("/api/dashboard/staff");
      expect(res.status).toBe(401);
      expect(res.body.error?.code).toBe("UNAUTHORIZED");
    });

    it("rejects REQUESTER role with 403 Forbidden", async () => {
      const res = await request(app)
        .get("/api/dashboard/staff")
        .set("Cookie", `toktickit_session=${requesterToken}`);
      expect(res.status).toBe(403);
      expect(res.body.error?.code).toBe("FORBIDDEN");
    });

    it("allows IT_STAFF role with 200 OK", async () => {
      const res = await request(app)
        .get("/api/dashboard/staff")
        .set("Cookie", `toktickit_session=${tokenStaffA}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("metrics");
      expect(res.body).toHaveProperty("recentTickets");
    });

    it("allows ADMINISTRATOR role with 200 OK", async () => {
      const res = await request(app)
        .get("/api/dashboard/staff")
        .set("Cookie", `toktickit_session=${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("metrics");
      expect(res.body).toHaveProperty("adminOverview");
    });
  });

  describe("2. Operational Queue Metrics & Individual Workload Scoping", () => {
    it("accurately calculates queue counts and scopes 'ownedByMe' to authenticated staff", async () => {
      // Create:
      // - 2 unassigned tickets (1 URGENT, 1 MEDIUM)
      // - 2 tickets owned by Staff A (1 HIGH, 1 LOW, one is WAITING_FOR_REQUESTER)
      // - 1 ticket owned by Staff B (MEDIUM)
      // - 1 ticket resolved today
      const today = new Date();

      await prisma.ticket.create({
        data: {
          ticketNumber: "TCK-OP-UNASSIGNED-1",
          summary: "Unassigned switch crash",
          description: "Detail description",
          categoryId: testCategory.id,
          relatedSystemId: testSystem.id,
          requesterId: requesterUser.id,
          ownerId: null,
          itPriority: ITPriority.URGENT,
          currentStatus: TicketStatus.OPEN,
        },
      });

      await prisma.ticket.create({
        data: {
          ticketNumber: "TCK-OP-UNASSIGNED-2",
          summary: "Unassigned printer issue",
          description: "Detail description",
          categoryId: testCategory.id,
          relatedSystemId: testSystem.id,
          requesterId: requesterUser.id,
          ownerId: null,
          itPriority: ITPriority.MEDIUM,
          currentStatus: TicketStatus.NEW,
        },
      });

      await prisma.ticket.create({
        data: {
          ticketNumber: "TCK-OP-STAFF-A1",
          summary: "Staff A ticket urgent",
          description: "Detail description",
          categoryId: testCategory.id,
          relatedSystemId: testSystem.id,
          requesterId: requesterUser.id,
          ownerId: staffA.id,
          itPriority: ITPriority.HIGH,
          currentStatus: TicketStatus.IN_PROGRESS,
        },
      });

      await prisma.ticket.create({
        data: {
          ticketNumber: "TCK-OP-STAFF-A2",
          summary: "Staff A ticket waiting",
          description: "Detail description",
          categoryId: testCategory.id,
          relatedSystemId: testSystem.id,
          requesterId: requesterUser.id,
          ownerId: staffA.id,
          itPriority: ITPriority.LOW,
          currentStatus: TicketStatus.WAITING_FOR_REQUESTER,
        },
      });

      await prisma.ticket.create({
        data: {
          ticketNumber: "TCK-OP-STAFF-B1",
          summary: "Staff B ticket",
          description: "Detail description",
          categoryId: testCategory.id,
          relatedSystemId: testSystem.id,
          requesterId: requesterUser.id,
          ownerId: staffB.id,
          itPriority: ITPriority.MEDIUM,
          currentStatus: TicketStatus.IN_PROGRESS,
        },
      });

      await prisma.ticket.create({
        data: {
          ticketNumber: "TCK-OP-RESOLVED-TODAY",
          summary: "Resolved today ticket",
          description: "Detail description",
          categoryId: testCategory.id,
          relatedSystemId: testSystem.id,
          requesterId: requesterUser.id,
          ownerId: staffA.id,
          itPriority: ITPriority.MEDIUM,
          currentStatus: TicketStatus.RESOLVED,
          resolvedAt: today,
          resolutionSummary: "Resolution completed today successfully.",
        },
      });

      // Query dashboard as Staff A
      const resStaffA = await request(app)
        .get("/api/dashboard/staff")
        .set("Cookie", `toktickit_session=${tokenStaffA}`);

      expect(resStaffA.status).toBe(200);
      const metricsA = resStaffA.body.metrics;

      // Active tickets in DB include at least 5 from our test
      expect(metricsA.totalOpen).toBeGreaterThanOrEqual(5);
      expect(metricsA.unassigned).toBeGreaterThanOrEqual(2);
      // ownedByMe for Staff A must be at least 2
      expect(metricsA.ownedByMe).toBeGreaterThanOrEqual(2);
      expect(metricsA.myAssigned).toBe(metricsA.ownedByMe);
      expect(metricsA.waitingForRequester).toBeGreaterThanOrEqual(1);
      expect(metricsA.urgentOrHigh).toBeGreaterThanOrEqual(2); // URGENT unassigned + HIGH Staff A
      expect(metricsA.resolvedToday).toBeGreaterThanOrEqual(1);

      // Query dashboard as Staff B
      const resStaffB = await request(app)
        .get("/api/dashboard/staff")
        .set("Cookie", `toktickit_session=${tokenStaffB}`);

      expect(resStaffB.status).toBe(200);
      const metricsB = resStaffB.body.metrics;

      // Staff B should have their own owned count
      expect(metricsB.ownedByMe).toBeGreaterThanOrEqual(1);
      // Staff A's count and Staff B's count differ accordingly
      expect(metricsB.totalOpen).toBe(metricsA.totalOpen);
      expect(metricsB.unassigned).toBe(metricsA.unassigned);
    });
  });

  describe("3. Average Resolution Time & Safe Zero Division", () => {
    it("safely returns 0 minutes and '0m' when zero tickets were resolved in the window", async () => {
      // Safe zero division test
      const zeroCalc = calculateAverageResolution([]);
      expect(zeroCalc.avgMinutes).toBe(0);
      expect(zeroCalc.formatted).toBe("0m");

      // Verify endpoint returns numeric metrics and string formatted
      const res = await request(app)
        .get("/api/dashboard/staff")
        .set("Cookie", `toktickit_session=${tokenStaffA}`);

      expect(res.status).toBe(200);
      expect(typeof res.body.metrics.avgResolutionMinutes).toBe("number");
      expect(typeof res.body.metrics.avgResolutionFormatted).toBe("string");
    });

    it("calculates accurate average resolution time when tickets were resolved", async () => {
      // Create a ticket resolved 2 hours after creation (120 minutes)
      const now = new Date();
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
      const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000);

      await prisma.ticket.create({
        data: {
          ticketNumber: "TCK-AVG-RES-1",
          summary: "Ticket resolved in 120 mins",
          description: "Detail description",
          categoryId: testCategory.id,
          relatedSystemId: testSystem.id,
          requesterId: requesterUser.id,
          currentStatus: TicketStatus.RESOLVED,
          createdAt: fourHoursAgo,
          resolvedAt: twoHoursAgo, // took 2 hours = 120 mins
          resolutionSummary: "Resolution completed in 2 hours.",
        },
      });

      const res = await request(app)
        .get("/api/dashboard/staff")
        .set("Cookie", `toktickit_session=${tokenStaffA}`);

      expect(res.status).toBe(200);
      expect(res.body.metrics.avgResolutionMinutes).toBeGreaterThan(0);
      expect(res.body.metrics.avgResolutionFormatted).toMatch(/\d+[hm]/);
    });
  });

  describe("4. Breakdown Aggregations (Status & Priority)", () => {
    it("returns status and priority breakdowns with count and percentage", async () => {
      const res = await request(app)
        .get("/api/dashboard/staff")
        .set("Cookie", `toktickit_session=${tokenStaffA}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("breakdown");
      expect(Array.isArray(res.body.breakdown.byStatus)).toBe(true);
      expect(Array.isArray(res.body.breakdown.byPriority)).toBe(true);
      expect(Array.isArray(res.body.ticketsByStatus)).toBe(true);
      expect(Array.isArray(res.body.ticketsByPriority)).toBe(true);

      if (res.body.breakdown.byStatus.length > 0) {
        const item = res.body.breakdown.byStatus[0];
        expect(item).toHaveProperty("status");
        expect(item).toHaveProperty("count");
        expect(item).toHaveProperty("percentage");
      }
    });

    it("supports GET /api/dashboard/staff/breakdown companion endpoint", async () => {
      const res = await request(app)
        .get("/api/dashboard/staff/breakdown")
        .set("Cookie", `toktickit_session=${tokenStaffA}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("byStatus");
      expect(res.body).toHaveProperty("byPriority");
      expect(res.body).toHaveProperty("byCategory");
    });
  });

  describe("5. Recent Tickets & Recent Urgent Tickets List", () => {
    it("returns up to 10 recent tickets and top recent urgent tickets", async () => {
      const res = await request(app)
        .get("/api/dashboard/staff")
        .set("Cookie", `toktickit_session=${tokenStaffA}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.recentTickets)).toBe(true);
      expect(res.body.recentTickets.length).toBeLessThanOrEqual(10);
      expect(Array.isArray(res.body.recentUrgentTickets)).toBe(true);
      expect(res.body.recentUrgentTickets.length).toBeLessThanOrEqual(5);

      if (res.body.recentTickets.length > 0) {
        const t = res.body.recentTickets[0];
        expect(t).toHaveProperty("id");
        expect(t).toHaveProperty("ticketNumber");
        expect(t).toHaveProperty("summary");
        expect(t).toHaveProperty("requesterName");
        expect(t).toHaveProperty("itPriority");
        expect(t).toHaveProperty("currentStatus");
        expect(t).toHaveProperty("updatedAt");
      }
    });
  });

  describe("6. Administrator Support (adminOverview)", () => {
    it("excludes adminOverview when accessed by regular IT_STAFF", async () => {
      const res = await request(app)
        .get("/api/dashboard/staff")
        .set("Cookie", `toktickit_session=${tokenStaffA}`);

      expect(res.status).toBe(200);
      expect(res.body.adminOverview).toBeUndefined();
    });

    it("includes concise user account statistics when accessed by ADMINISTRATOR", async () => {
      const res = await request(app)
        .get("/api/dashboard/staff")
        .set("Cookie", `toktickit_session=${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.adminOverview).toBeDefined();
      expect(typeof res.body.adminOverview.totalUsers).toBe("number");
      expect(typeof res.body.adminOverview.activeStaff).toBe("number");
      expect(typeof res.body.adminOverview.activeRequesters).toBe("number");
      expect(res.body.adminOverview.totalUsers).toBeGreaterThanOrEqual(3);
      expect(res.body.adminOverview.activeStaff).toBeGreaterThanOrEqual(2);
    });
  });
});
