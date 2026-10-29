import { describe, it, expect, afterAll } from "vitest";
import { getPrisma } from "../../src/prisma.js";
import fs from "fs";
import path from "path";

describe("Lab 4: Database Migration & Rollback Verification (MIGR-01, AC-18, BR-23, FR-22)", () => {
  const prisma = getPrisma();

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("1. Migration Artifacts & Structure", () => {
    it("verifies the forward migration file exists and contains additive definitions", () => {
      const migrationDir = path.resolve(
        __dirname,
        "../../prisma/migrations/20261028000000_lab4_actions_taken_and_workflow"
      );
      expect(fs.existsSync(migrationDir)).toBe(true);

      const migrationSqlPath = path.join(migrationDir, "migration.sql");
      expect(fs.existsSync(migrationSqlPath)).toBe(true);

      const sqlContent = fs.readFileSync(migrationSqlPath, "utf-8");
      expect(sqlContent).toContain('CREATE TABLE "actions_taken"');
      expect(sqlContent).toContain('ALTER TABLE "tickets" ADD COLUMN');
      expect(sqlContent).toContain('"resolvedAt"');
      expect(sqlContent).toContain('"closedAt"');
      expect(sqlContent).toContain('"resolutionSummary"');
      expect(sqlContent).toContain('REFERENCES "tickets"("id") ON DELETE CASCADE');
      expect(sqlContent).toContain('REFERENCES "users"("id") ON DELETE RESTRICT');
    });

    it("verifies the documented rollback script exists and contains reversible down-migration", () => {
      const rollbackPath = path.resolve(
        __dirname,
        "../../prisma/migrations/20261028000000_lab4_actions_taken_and_workflow/rollback.sql"
      );
      expect(fs.existsSync(rollbackPath)).toBe(true);

      const rollbackSql = fs.readFileSync(rollbackPath, "utf-8");
      expect(rollbackSql).toContain('DROP TABLE IF EXISTS "actions_taken" CASCADE');
      expect(rollbackSql).toContain('DROP COLUMN IF EXISTS "resolvedAt"');
      expect(rollbackSql).toContain('DROP COLUMN IF EXISTS "closedAt"');
      expect(rollbackSql).toContain('DROP COLUMN IF EXISTS "resolutionSummary"');
    });
  });

  describe("2. Database Schema State & Constraints", () => {
    it("verifies actions_taken table exists in database catalog", async () => {
      const tables: Array<{ table_name: string }> = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'actions_taken';
      `;
      expect(tables).toHaveLength(1);
      expect(tables[0].table_name).toBe("actions_taken");
    });

    it("verifies tickets table contains workflow and resolution columns", async () => {
      const columns: Array<{ column_name: string }> = await prisma.$queryRaw`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'tickets' 
          AND column_name IN ('resolvedAt', 'closedAt', 'resolutionSummary');
      `;
      const colNames = columns.map((c) => c.column_name);
      expect(colNames).toContain("resolvedAt");
      expect(colNames).toContain("closedAt");
      expect(colNames).toContain("resolutionSummary");
    });

    it("verifies foreign key constraints on actions_taken", async () => {
      const fkConstraints: Array<{ constraint_name: string }> = await prisma.$queryRaw`
        SELECT tc.constraint_name
        FROM information_schema.table_constraints AS tc
        WHERE tc.table_schema = 'public'
          AND tc.table_name = 'actions_taken'
          AND tc.constraint_type = 'FOREIGN KEY';
      `;
      expect(fkConstraints.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("3. Data Preservation & Backward Compatibility Invariant (BR-24, AC-18)", () => {
    it("preserves existing ticket data without corruption", async () => {
      const tickets = await prisma.ticket.findMany();
      expect(tickets.length).toBeGreaterThan(0);
      for (const t of tickets) {
        expect(t.ticketNumber).toMatch(/^TKT-/);
        expect(t.summary).toBeTruthy();
        expect(typeof t.description).toBe("string");
      }
    });

    it("allows tickets with zero actions taken to remain fully valid and queryable", async () => {
      const ticketsWithoutActions = await prisma.ticket.findMany({
        where: {
          actionsTaken: {
            none: {},
          },
        },
      });
      expect(ticketsWithoutActions.length).toBeGreaterThanOrEqual(1);
    });
  });
});
