import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

describe("Attachment API Lifecycle (EP-07..10, API-03, API-05, API-06, AC-03, AC-07, AC-08, BR-05, BR-07, BR-08)", () => {
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

    const ticketRes = await request(app)
      .post("/api/tickets")
      .set("X-Requester-Id", requesterAId)
      .send({
        summary: "Attachment Testing Ticket",
        description: "Testing file attachment lifecycle",
        categoryId,
        relatedSystemId,
      });

    ticketIdA = ticketRes.body.id;
  });

  it("POST /api/tickets/:id/attachments uploads valid PDF file successfully", async () => {
    const res = await request(app)
      .post(`/api/tickets/${ticketIdA}/attachments`)
      .set("X-Requester-Id", requesterAId)
      .attach("file", Buffer.from("%PDF-1.4 test pdf content"), {
        filename: "test_doc.pdf",
        contentType: "application/pdf",
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.fileName).toBe("test_doc.pdf");
    expect(res.body.mimeType).toBe("application/pdf");
  });

  it("POST /api/tickets/:id/attachments rejects unpermitted file types (e.g. text/plain)", async () => {
    const res = await request(app)
      .post(`/api/tickets/${ticketIdA}/attachments`)
      .set("X-Requester-Id", requesterAId)
      .attach("file", Buffer.from("console.log('hello');"), {
        filename: "script.txt",
        contentType: "text/plain",
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/File type not permitted/i);
  });

  it("POST /api/tickets/:id/attachments blocks upload when requested by Requester B (Ownership Protection)", async () => {
    const res = await request(app)
      .post(`/api/tickets/${ticketIdA}/attachments`)
      .set("X-Requester-Id", requesterBId)
      .attach("file", Buffer.from("fake png"), {
        filename: "image.png",
        contentType: "image/png",
      });

    expect([403, 404]).toContain(res.status);
    expect(res.body.error).toMatch(/not found or access denied/i);
  });

  it("GET /api/attachments/:id/metadata returns metadata for owned attachment", async () => {
    const uploadRes = await request(app)
      .post(`/api/tickets/${ticketIdA}/attachments`)
      .set("X-Requester-Id", requesterAId)
      .attach("file", Buffer.from("png data"), {
        filename: "screenshot.png",
        contentType: "image/png",
      });

    const attachmentId = uploadRes.body.id;

    const res = await request(app)
      .get(`/api/attachments/${attachmentId}/metadata`)
      .set("X-Requester-Id", requesterAId);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(attachmentId);
    expect(res.body.fileName).toBe("screenshot.png");
    expect(res.body.deletedAt).toBeNull();
  });

  it("GET /api/attachments/:id/download streams active binary file and blocks soft-removed attachment", async () => {
    const uploadRes = await request(app)
      .post(`/api/tickets/${ticketIdA}/attachments`)
      .set("X-Requester-Id", requesterAId)
      .attach("file", Buffer.from("sample pdf content for download"), {
        filename: "manual.pdf",
        contentType: "application/pdf",
      });

    const attachmentId = uploadRes.body.id;

    // Active download succeeds
    const downloadRes = await request(app)
      .get(`/api/attachments/${attachmentId}/download`)
      .set("X-Requester-Id", requesterAId);

    expect(downloadRes.status).toBe(200);

    // Cross-requester download fails
    const forbiddenRes = await request(app)
      .get(`/api/attachments/${attachmentId}/download`)
      .set("X-Requester-Id", requesterBId);

    expect([403, 404]).toContain(forbiddenRes.status);

    // Soft-remove attachment with reason
    const deleteRes = await request(app)
      .delete(`/api/attachments/${attachmentId}`)
      .set("X-Requester-Id", requesterAId)
      .send({ removalReason: "Outdated file version" });

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.removalReason).toBe("Outdated file version");
    expect(deleteRes.body.deletedAt).not.toBeNull();

    // Soft-removed download is blocked
    const blockedRes = await request(app)
      .get(`/api/attachments/${attachmentId}/download`)
      .set("X-Requester-Id", requesterAId);

    expect(blockedRes.status).toBe(403);
    expect(blockedRes.body.error).toMatch(/soft-removed and cannot be downloaded/i);
  });

  it("DELETE /api/attachments/:id requires removal reason", async () => {
    const uploadRes = await request(app)
      .post(`/api/tickets/${ticketIdA}/attachments`)
      .set("X-Requester-Id", requesterAId)
      .attach("file", Buffer.from("jpg data"), {
        filename: "photo.jpg",
        contentType: "image/jpeg",
      });

    const attachmentId = uploadRes.body.id;

    const res = await request(app)
      .delete(`/api/attachments/${attachmentId}`)
      .set("X-Requester-Id", requesterAId)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Removal reason is required/i);
  });
});
