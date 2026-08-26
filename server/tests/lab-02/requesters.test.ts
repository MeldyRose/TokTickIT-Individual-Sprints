import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

describe("GET /api/requesters", () => {
  it("returns 200 OK with active requesters and excludes inactive ones", async () => {
    const res = await request(app).get("/api/requesters");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);

    // Verify all returned requesters have id, name, email
    for (const requester of res.body) {
      expect(requester).toHaveProperty("id");
      expect(requester).toHaveProperty("name");
      expect(requester).toHaveProperty("email");
    }

    // Verify inactive requester is not included
    const names = res.body.map((r: { name: string }) => r.name);
    expect(names).not.toContain("Inactive User Test");
    expect(names.length).toBeGreaterThan(0);
  });
});
