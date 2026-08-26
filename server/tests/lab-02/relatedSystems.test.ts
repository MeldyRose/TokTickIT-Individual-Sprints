import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

describe("GET /api/related-systems", () => {
  it("returns 200 OK with active related systems", async () => {
    const res = await request(app).get("/api/related-systems");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);

    for (const sys of res.body) {
      expect(sys).toHaveProperty("id");
      expect(sys).toHaveProperty("name");
    }

    const systemNames = res.body.map((s: { name: string }) => s.name);
    expect(systemNames).toContain("Email");
    expect(systemNames).toContain("Campus Wi-Fi");
    expect(systemNames).toContain("VPN");
  });
});
