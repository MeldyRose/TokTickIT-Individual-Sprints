import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

describe("Ticket API Endpoints (Issue 4)", () => {
  let requesterAId = "";
  let requesterBId = "";
  let categoryId = "";
  let relatedSystemId = "";

  beforeEach(async () => {
    // Get active requesters
    const reqRes = await request(app).get("/api/requesters");
    if (reqRes.body.length >= 2) {
      requesterAId = reqRes.body[0].id;
      requesterBId = reqRes.body[1].id;
    }

    // Get active category and related system
    const catRes = await request(app).get("/api/categories");
    if (catRes.body.length > 0) {
      categoryId = catRes.body[0].id;
    }

    const sysRes = await request(app).get("/api/related-systems");
    if (sysRes.body.length > 0) {
      relatedSystemId = sysRes.body[0].id;
    }
  });

  describe("POST /api/tickets (API-01, AC-01, BR-01, BR-06)", () => {
    it("returns 400 Bad Request when X-Requester-Id header is missing", async () => {
      const res = await request(app).post("/api/tickets").send({
        summary: "Laptop battery issue",
        categoryId,
        relatedSystemId,
      });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/X-Requester-Id header is required/i);
    });

    it("returns 400 Bad Request when mandatory fields are missing", async () => {
      const res = await request(app)
        .post("/api/tickets")
        .set("X-Requester-Id", requesterAId)
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
        .set("X-Requester-Id", requesterAId)
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
    it("returns 400 Bad Request when X-Requester-Id header is missing", async () => {
      const res = await request(app).get("/api/tickets");
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/X-Requester-Id header is required/i);
    });

    it("returns paginated tickets belonging strictly to X-Requester-Id (AC-04)", async () => {
      // Create a ticket for Requester A
      await request(app)
        .post("/api/tickets")
        .set("X-Requester-Id", requesterAId)
        .send({
          summary: "Requester A Ticket Unique Test",
          categoryId,
          relatedSystemId,
        });

      // Fetch tickets as Requester A
      const resA = await request(app)
        .get("/api/tickets")
        .set("X-Requester-Id", requesterAId);

      expect(resA.status).toBe(200);
      expect(resA.body).toHaveProperty("data");
      expect(resA.body).toHaveProperty("pagination");
      expect(Array.isArray(resA.body.data)).toBe(true);

      const summariesA = resA.body.data.map((t: { summary: string }) => t.summary);
      expect(summariesA).toContain("Requester A Ticket Unique Test");

      // Fetch tickets as Requester B (should NOT see Requester A's ticket)
      const resB = await request(app)
        .get("/api/tickets")
        .set("X-Requester-Id", requesterBId);

      expect(resB.status).toBe(200);
      const summariesB = resB.body.data.map((t: { summary: string }) => t.summary);
      expect(summariesB).not.toContain("Requester A Ticket Unique Test");
    });

    it("supports search, filtering, and pagination", async () => {
      // Create ticket for search
      const createdRes = await request(app)
        .post("/api/tickets")
        .set("X-Requester-Id", requesterAId)
        .send({
          summary: "Printer paper jam in 4th floor office",
          categoryId,
          relatedSystemId,
        });

      const ticketNo = createdRes.body.ticketNumber;

      // Search by ticket number
      const searchRes = await request(app)
        .get(`/api/tickets?search=${ticketNo}`)
        .set("X-Requester-Id", requesterAId);

      expect(searchRes.status).toBe(200);
      expect(searchRes.body.data.length).toBeGreaterThan(0);
      expect(searchRes.body.data[0].ticketNumber).toBe(ticketNo);
    });
  });
});
