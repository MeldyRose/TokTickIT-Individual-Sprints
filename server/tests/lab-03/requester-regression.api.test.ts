import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import bcrypt from "bcryptjs";

describe("Requester Operations & Regression API (Issue 16)", () => {
  let requesterToken = "";
  let requesterId = "";
  let otherRequesterToken = "";
  let otherRequesterId = "";
  let categoryId = "";
  let relatedSystemId = "";

  beforeEach(async () => {
    const reqPasswordHash = bcrypt.hashSync("Password123!", 10);

    let userA = await getPrisma().user.findUnique({ where: { email: "jennifer.test16@toktickit.com" } });
    if (!userA) {
      userA = await getPrisma().user.create({
        data: {
          name: "Jennifer Test16",
          email: "jennifer.test16@toktickit.com",
          passwordHash: reqPasswordHash,
          role: "REQUESTER",
          isActive: true,
          mustChangePassword: false,
        },
      });
    }
    requesterId = userA.id;

    let userB = await getPrisma().user.findUnique({ where: { email: "michael.test16@toktickit.com" } });
    if (!userB) {
      userB = await getPrisma().user.create({
        data: {
          name: "Michael Test16",
          email: "michael.test16@toktickit.com",
          passwordHash: reqPasswordHash,
          role: "REQUESTER",
          isActive: true,
          mustChangePassword: false,
        },
      });
    }
    otherRequesterId = userB.id;

    // Log in Requester A
    const loginResA = await request(app)
      .post("/api/auth/login")
      .send({ email: "jennifer.test16@toktickit.com", password: "Password123!" });
    
    const cookiesA = loginResA.headers["set-cookie"];
    if (cookiesA) {
      const match = cookiesA[0].match(/toktickit_session=([^;]+)/);
      if (match) requesterToken = match[1];
    }

    // Log in Requester B
    const loginResB = await request(app)
      .post("/api/auth/login")
      .send({ email: "michael.test16@toktickit.com", password: "Password123!" });
    
    const cookiesB = loginResB.headers["set-cookie"];
    if (cookiesB) {
      const match = cookiesB[0].match(/toktickit_session=([^;]+)/);
      if (match) otherRequesterToken = match[1];
    }

    // Get categories and systems
    const catRes = await request(app).get("/api/categories");
    if (catRes.body.length > 0) categoryId = catRes.body[0].id;

    const sysRes = await request(app).get("/api/related-systems");
    if (sysRes.body.length > 0) relatedSystemId = sysRes.body[0].id;
  });

  it("derives Requester identity from session and ignores X-Requester-Id header (AC-03, BR-22)", async () => {
    // Session token belongs to Jennifer (userA). Header tries to claim to be userB (michael).
    const res = await request(app)
      .post("/api/tickets")
      .set("Cookie", [`toktickit_session=${requesterToken}`])
      .set("X-Requester-Id", otherRequesterId)
      .send({
        summary: "Ticket created under session identity",
        description: "Checking AC-03 session scoping",
        categoryId,
        relatedSystemId,
      });

    expect(res.status).toBe(201);
    expect(res.body.requesterId).toBe(requesterId); // Must be Jennifer's ID, ignoring header
    expect(res.body.requesterId).not.toBe(otherRequesterId);
  });

  it("allows Requesters to post and view Public Comments on owned tickets (AC-10)", async () => {
    // Create ticket
    const ticketRes = await request(app)
      .post("/api/tickets")
      .set("Cookie", [`toktickit_session=${requesterToken}`])
      .send({
        summary: "Public comments test ticket",
        categoryId,
        relatedSystemId,
      });

    const ticketId = ticketRes.body.id;

    // Post comment
    const postCommentRes = await request(app)
      .post(`/api/tickets/${ticketId}/comments`)
      .set("Cookie", [`toktickit_session=${requesterToken}`])
      .send({ content: "Please update me when resolved." });

    expect(postCommentRes.status).toBe(201);
    expect(postCommentRes.body.content).toBe("Please update me when resolved.");
    expect(postCommentRes.body.author.id).toBe(requesterId);

    // View comments
    const getCommentsRes = await request(app)
      .get(`/api/tickets/${ticketId}/comments`)
      .set("Cookie", [`toktickit_session=${requesterToken}`]);

    expect(getCommentsRes.status).toBe(200);
    expect(Array.isArray(getCommentsRes.body)).toBe(true);
    expect(getCommentsRes.body.length).toBeGreaterThan(0);
    expect(getCommentsRes.body[0].content).toBe("Please update me when resolved.");
  });

  it("blocks Requesters from accessing Internal Notes with 403 Forbidden (AC-04, BR-04)", async () => {
    const ticketRes = await request(app)
      .post("/api/tickets")
      .set("Cookie", [`toktickit_session=${requesterToken}`])
      .send({
        summary: "Internal notes permission test",
        categoryId,
        relatedSystemId,
      });

    const ticketId = ticketRes.body.id;

    // Attempt GET internal notes
    const getNotesRes = await request(app)
      .get(`/api/tickets/${ticketId}/notes`)
      .set("Cookie", [`toktickit_session=${requesterToken}`]);

    expect(getNotesRes.status).toBe(403);
    expect(getNotesRes.body.error).toMatch(/Forbidden/i);

    // Attempt POST internal notes
    const postNoteRes = await request(app)
      .post(`/api/tickets/${ticketId}/notes`)
      .set("Cookie", [`toktickit_session=${requesterToken}`])
      .send({ content: "Unauthorized note attempt" });

    expect(postNoteRes.status).toBe(403);
    expect(postNoteRes.body.error).toMatch(/Forbidden/i);
  });

  it("allows Requesters to trigger Problem Appears Resolved but blocks direct RESOLVED/CLOSED status (AC-09, BR-05)", async () => {
    const ticketRes = await request(app)
      .post("/api/tickets")
      .set("Cookie", [`toktickit_session=${requesterToken}`])
      .send({
        summary: "Status update test ticket",
        categoryId,
        relatedSystemId,
      });

    const ticketId = ticketRes.body.id;

    // Attempt direct RESOLVED status -> 403
    const directResolvedRes = await request(app)
      .patch(`/api/tickets/${ticketId}/status`)
      .set("Cookie", [`toktickit_session=${requesterToken}`])
      .send({ status: "RESOLVED" });

    expect(directResolvedRes.status).toBe(403);

    // Attempt direct CLOSED status -> 403
    const directClosedRes = await request(app)
      .patch(`/api/tickets/${ticketId}/status`)
      .set("Cookie", [`toktickit_session=${requesterToken}`])
      .send({ status: "CLOSED" });

    expect(directClosedRes.status).toBe(403);

    // Trigger Problem Appears Resolved -> WAITING_FOR_REQUESTER (200 OK)
    const resolvedActionRes = await request(app)
      .patch(`/api/tickets/${ticketId}/status`)
      .set("Cookie", [`toktickit_session=${requesterToken}`])
      .send({ status: "WAITING_FOR_REQUESTER", comment: "Looks fixed on my end." });

    expect(resolvedActionRes.status).toBe(200);
    expect(resolvedActionRes.body.currentStatus).toBe("WAITING_FOR_REQUESTER");
  });
});
