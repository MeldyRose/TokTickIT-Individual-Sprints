import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import bcrypt from "bcryptjs";
import { Role, TicketStatus, ITPriority } from "@prisma/client";
import { calculateAverageResolution, getDaysAgo } from "../../src/utils/dashboardUtils.js";

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

  beforeAll(async () => {
    const passwordHash = bcrypt.hashSync("Password123!", 10);

    // 1. Setup staff and admin users once in beforeAll to prevent concurrency flakiness in parallel suites
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

    // 3. Authenticate users once in beforeAll
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

  afterAll(async () => {
    // Clean up created tickets and users to leave DB pristine
    await prisma.ticket.deleteMany({
      where: {
        OR: [
          { requesterId: requesterUser.id },
          { ownerId: { in: [staffA.id, staffB.id] } },
        ],
      },
    });
    await prisma.user.deleteMany({
      where: {
        id: { in: [staffA.id, staffB.id, adminUser.id, requesterUser.id] },
      },
    });
  });

  beforeEach(async () => {
    // Clear only this suite's test tickets to ensure deterministic counts without altering global seed data
    await prisma.ticket.deleteMany({
      where: {
        OR: [
          { requesterId: requesterUser.id },
          { ownerId: { in: [staffA.id, staffB.id] } },
        ],
      },
    });
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
    it("accurately calculates exact ownedByMe for Staff A and Staff B, and excludes terminal tickets", async () => {
      const today = new Date();

      // 1. Unassigned active tickets
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

      // 2. Staff A tickets: 2 active, 2 terminal (CLOSED, CANCELLED)
      await prisma.ticket.create({
        data: {
          ticketNumber: "TCK-OP-STAFF-A1",
          summary: "Staff A ticket active 1",
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
          summary: "Staff A ticket active 2",
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
          ticketNumber: "TCK-OP-STAFF-A-CLOSED",
          summary: "Staff A terminal closed ticket",
          description: "Detail description",
          categoryId: testCategory.id,
          relatedSystemId: testSystem.id,
          requesterId: requesterUser.id,
          ownerId: staffA.id,
          itPriority: ITPriority.MEDIUM,
          currentStatus: TicketStatus.CLOSED,
          closedAt: today,
        },
      });

      await prisma.ticket.create({
        data: {
          ticketNumber: "TCK-OP-STAFF-A-CANCELLED",
          summary: "Staff A terminal cancelled ticket",
          description: "Detail description",
          categoryId: testCategory.id,
          relatedSystemId: testSystem.id,
          requesterId: requesterUser.id,
          ownerId: staffA.id,
          itPriority: ITPriority.LOW,
          currentStatus: TicketStatus.CANCELLED,
        },
      });

      // 3. Staff B tickets: 1 active, 1 terminal
      await prisma.ticket.create({
        data: {
          ticketNumber: "TCK-OP-STAFF-B1",
          summary: "Staff B ticket active 1",
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
          ticketNumber: "TCK-OP-STAFF-B-CLOSED",
          summary: "Staff B terminal closed ticket",
          description: "Detail description",
          categoryId: testCategory.id,
          relatedSystemId: testSystem.id,
          requesterId: requesterUser.id,
          ownerId: staffB.id,
          itPriority: ITPriority.LOW,
          currentStatus: TicketStatus.CLOSED,
          closedAt: today,
        },
      });

      // 4. Ticket resolved today
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

      // Staff A owns 4 tickets total, but only 2 are active (IN_PROGRESS, WAITING_FOR_REQUESTER)
      // Terminal tickets (CLOSED, CANCELLED, RESOLVED) must be strictly excluded
      // Staff B's tickets must not leak into Staff A's count
      expect(metricsA.ownedByMe).toBe(2);
      expect(metricsA.myAssigned).toBe(2);
      expect(metricsA.totalOpen).toBeGreaterThanOrEqual(5);
      expect(metricsA.unassigned).toBeGreaterThanOrEqual(2);
      expect(metricsA.waitingForRequester).toBeGreaterThanOrEqual(1);
      expect(metricsA.urgentOrHigh).toBeGreaterThanOrEqual(2);
      expect(metricsA.resolvedToday).toBeGreaterThanOrEqual(1);

      // Query dashboard as Staff B
      const resStaffB = await request(app)
        .get("/api/dashboard/staff")
        .set("Cookie", `toktickit_session=${tokenStaffB}`);

      expect(resStaffB.status).toBe(200);
      const metricsB = resStaffB.body.metrics;

      // Staff B owns 2 tickets total, but only 1 is active (IN_PROGRESS)
      // Staff A's tickets must not leak into Staff B's count
      expect(metricsB.ownedByMe).toBe(1);
      expect(metricsB.myAssigned).toBe(1);
    });
  });

  describe("3. Average Resolution Time & Safe Zero Division", () => {
    it("safely returns 0 minutes and '0m' when zero tickets were resolved in the window", async () => {
      // Safe zero division unit assertion
      const zeroCalc = calculateAverageResolution([]);
      expect(zeroCalc.avgMinutes).toBe(0);
      expect(zeroCalc.formatted).toBe("0m");

      // Verify endpoint handles empty resolution safely
      const res = await request(app)
        .get("/api/dashboard/staff")
        .set("Cookie", `toktickit_session=${tokenStaffA}`);

      expect(res.status).toBe(200);
      expect(typeof res.body.metrics.avgResolutionMinutes).toBe("number");
      expect(typeof res.body.metrics.avgResolutionFormatted).toBe("string");
    });

    it("asserts exact average resolution calculation for a 120-minute ticket and multi-day resolutions", async () => {
      const now = new Date();
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
      const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000);

      // 1. Assert exact calculation for a single 120-minute resolved ticket
      const singleTicketCalc = calculateAverageResolution([
        { createdAt: fourHoursAgo, resolvedAt: twoHoursAgo },
      ]);
      expect(singleTicketCalc.avgMinutes).toBe(120);
      expect(singleTicketCalc.formatted).toBe("2h");

      // 2. Assert exact multi-ticket duration calculation (225 min + 10d 6.5h -> 7508 min -> "5d 5h 8m")
      const multiTicketCalc = calculateAverageResolution([
        { createdAt: new Date(0), resolvedAt: new Date(225 * 60 * 1000) },
        { createdAt: new Date(0), resolvedAt: new Date((10 * 24 * 60 + 6.5 * 60) * 60 * 1000) },
      ]);
      expect(multiTicketCalc.avgMinutes).toBe(7508);
      expect(multiTicketCalc.formatted).toBe("5d 5h 8m");

      // 3. Verify endpoint returns consistent aggregated calculation matching current DB resolved tickets
      const res = await request(app)
        .get("/api/dashboard/staff")
        .set("Cookie", `toktickit_session=${tokenStaffA}`);

      expect(res.status).toBe(200);
      const dbResolvedTickets = await prisma.ticket.findMany({
        where: { resolvedAt: { gte: getDaysAgo(30) } },
        select: { createdAt: true, resolvedAt: true },
      });
      const expectedAvg = calculateAverageResolution(dbResolvedTickets);
      expect(res.body.metrics.avgResolutionMinutes).toBe(expectedAvg.avgMinutes);
      expect(res.body.metrics.avgResolutionFormatted).toBe(expectedAvg.formatted);
    });
  });

  describe("4. Breakdown Aggregations (Status & Priority)", () => {
    it("returns all status and priority enum values in breakdown, including those with 0 tickets", async () => {
      const res = await request(app)
        .get("/api/dashboard/staff")
        .set("Cookie", `toktickit_session=${tokenStaffA}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("breakdown");

      // Verify all statuses are present in byStatus
      const allStatuses = Object.values(TicketStatus);
      const returnedStatuses = res.body.breakdown.byStatus.map((item: any) => item.status);
      for (const st of allStatuses) {
        expect(returnedStatuses).toContain(st);
      }

      // Verify all priorities are present in byPriority
      const allPriorities = [ITPriority.URGENT, ITPriority.HIGH, ITPriority.MEDIUM, ITPriority.LOW];
      const returnedPriorities = res.body.breakdown.byPriority.map((item: any) => item.priority);
      for (const pr of allPriorities) {
        expect(returnedPriorities).toContain(pr);
      }

      // Verify structure of items
      const statusItem = res.body.breakdown.byStatus[0];
      expect(statusItem).toHaveProperty("status");
      expect(typeof statusItem.count).toBe("number");
      expect(typeof statusItem.percentage).toBe("number");
    });

    it("supports GET /api/dashboard/staff/breakdown companion endpoint with all enum values", async () => {
      const res = await request(app)
        .get("/api/dashboard/staff/breakdown")
        .set("Cookie", `toktickit_session=${tokenStaffA}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("byStatus");
      expect(res.body).toHaveProperty("byPriority");
      expect(res.body).toHaveProperty("byCategory");

      const allStatuses = Object.values(TicketStatus);
      const returnedStatuses = res.body.byStatus.map((item: any) => item.status);
      for (const st of allStatuses) {
        expect(returnedStatuses).toContain(st);
      }
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
      expect(res.body.adminOverview.activeStaff).toBeGreaterThanOrEqual(1);
    });
  });
});
