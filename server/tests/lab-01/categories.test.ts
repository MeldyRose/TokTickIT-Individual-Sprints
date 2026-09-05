import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

describe("GET /api/categories", () => {
  it("returns the four seeded categories in id order", async () => {
    const res = await request(app).get("/api/categories");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(4);
    expect(res.body.map((cat: { id: string; name: string; description?: string }) => cat.id)).toEqual([
      "cat-acc-001",
      "cat-hwd-002",
      "cat-sfw-003",
      "cat-net-004",
    ]);
    expect(res.body.map((cat: { id: string; name: string; description?: string }) => cat.name)).toEqual([
      "Account and Access",
      "Hardware",
      "Software",
      "Network",
    ]);
    expect(res.body[0]).toHaveProperty("description");
  });
});

