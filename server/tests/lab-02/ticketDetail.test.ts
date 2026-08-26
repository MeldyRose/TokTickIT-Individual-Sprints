import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

describe("GET /api/tickets/:id (EP-06, API-03, AC-03, FR-06, FR-07, BR-05)", () => {
  let requesterAId = "";
  let requesterBId = "";
  let categoryId = "";
  let relatedSystemId = "";
  let ticketIdA = "";

  beforeEach(async () => {
    const reqRes = await request(app).get("/api/requesters");
    if (reqRes.body.length >= 2) {
      requesterAId = reqRes.body[0].id;
      requesterBId = reqRes.body[1].id;
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
      .set("X-Requester-Id", requesterAId)
      .send({
        summary: "Issue 5 Ticket Detail Isolation Test",
        description: "Testing ticket detail endpoint and cross-requester protection.",
        categoryId,
        relatedSystemId,
        requestedPriority: "HIGH",
      });

    ticketIdA = ticketRes.body.id;
  });

  it("returns 400 Bad Request when X-Requester-Id header is missing", async () => {
    const res = await request(app).get(`/api/tickets/${ticketIdA}`);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/X-Requester-Id header is required/i);
  });

  it("returns 200 OK with full ticket details when requested by ticket owner", async () => {
    const res = await request(app)
      .get(`/api/tickets/${ticketIdA}`)
      .set("X-Requester-Id", requesterAId);

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
      .set("X-Requester-Id", requesterBId);

    expect([403, 404]).toContain(res.status);
    expect(res.body.error).toMatch(/Ticket not found or access denied/i);
  });
});
