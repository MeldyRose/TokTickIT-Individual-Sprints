import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { getPrisma } from "../prisma.js";
import { sessionStore } from "../services/sessionStore.js";
import { validatePasswordComplexity } from "../utils/passwordValidation.js";

export const adminUsersRouter = Router();

// Cache-Control: no-store for admin user endpoints
adminUsersRouter.use((_req: Request, res: Response, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

// Auth & Role Middleware for Administrator role enforcement
async function requireAdmin(req: Request, res: Response): Promise<any> {
  const token = sessionStore.extractToken(req);
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }

  const session = sessionStore.getSession(token);
  if (!session) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }

  const user = await getPrisma().user.findUnique({
    where: { id: session.userId },
  });

  if (!user || !user.isActive) {
    sessionStore.destroySession(token);
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }

  if (user.role !== Role.ADMINISTRATOR) {
    res.status(403).json({ error: "Forbidden: Administrator role required" });
    return null;
  }

  return user;
}

// GET /api/admin/users - List users with search and role filter (AC-12, FR-21, FR-22)
adminUsersRouter.get("/", async (req: Request, res: Response) => {
  try {
    const authUser = await requireAdmin(req, res);
    if (!authUser) return;

    const search = ((req.query.search as string) || "").trim();
    const roleParam = (req.query.role as string) || "";

    const where: any = {};

    if (roleParam && ["REQUESTER", "IT_STAFF", "ADMINISTRATOR"].includes(roleParam)) {
      where.role = roleParam as Role;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const users = await getPrisma().user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json(users);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch users" });
  }
});

// POST /api/admin/users - Create user (AC-13, BR-06, BR-07, BR-19)
adminUsersRouter.post("/", async (req: Request, res: Response) => {
  try {
    const authUser = await requireAdmin(req, res);
    if (!authUser) return;

    const { name, email, role, isActive, initialPassword } = req.body || {};

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return res.status(400).json({ error: "Name is required" });
    }

    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ error: "Valid email address is required" });
    }

    if (!role || !["REQUESTER", "IT_STAFF", "ADMINISTRATOR"].includes(role)) {
      return res.status(400).json({ error: "Valid role is required (REQUESTER, IT_STAFF, or ADMINISTRATOR)" });
    }

    if (!initialPassword || typeof initialPassword !== "string") {
      return res.status(400).json({ error: "Initial password is required" });
    }

    const complexityCheck = validatePasswordComplexity(initialPassword);
    if (!complexityCheck.isValid) {
      return res.status(400).json({ error: complexityCheck.reason || "Password complexity check failed" });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // BR-19: Duplicate email check
    const existingUser = await getPrisma().user.findFirst({
      where: {
        email: {
          equals: trimmedEmail,
          mode: "insensitive",
        },
      },
    });

    if (existingUser) {
      return res.status(409).json({ error: "A user account with this email address already exists." });
    }

    const passwordHash = bcrypt.hashSync(initialPassword, 10);
    const activeState = typeof isActive === "boolean" ? isActive : true;

    const newUser = await getPrisma().user.create({
      data: {
        name: name.trim(),
        email: trimmedEmail,
        passwordHash,
        role: role as Role,
        isActive: activeState,
        mustChangePassword: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
        createdAt: true,
      },
    });

    return res.status(201).json({ user: newUser });
  } catch (error) {
    return res.status(500).json({ error: "Failed to create user" });
  }
});

// PATCH /api/admin/users/:id - Edit user details & safety rules (AC-14, BR-17, BR-18, BR-19)
adminUsersRouter.patch("/:id", async (req: Request, res: Response) => {
  try {
    const authUser = await requireAdmin(req, res);
    if (!authUser) return;

    const { id } = req.params;
    const { name, email, role, isActive } = req.body || {};

    const targetUser = await getPrisma().user.findUnique({
      where: { id },
    });

    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // BR-17: Self-deactivation prevention
    if (authUser.id === targetUser.id && isActive === false) {
      return res.status(400).json({ error: "Self-deactivation is prohibited. You cannot deactivate your own logged-in account." });
    }

    // BR-18: Last active Administrator protection
    const isTargetActiveAdmin = targetUser.role === Role.ADMINISTRATOR && targetUser.isActive === true;
    const isDeactivating = isActive === false;
    const isChangingRoleFromAdmin = role !== undefined && role !== Role.ADMINISTRATOR;

    if (isTargetActiveAdmin && (isDeactivating || isChangingRoleFromAdmin)) {
      const activeAdminCount = await getPrisma().user.count({
        where: {
          role: Role.ADMINISTRATOR,
          isActive: true,
        },
      });

      if (activeAdminCount <= 1) {
        return res.status(400).json({ error: "Cannot deactivate or change role of the last active Administrator." });
      }
    }

    // BR-19: Duplicate email check when updating email
    let updatedEmail = targetUser.email;
    if (email && typeof email === "string" && email.trim().toLowerCase() !== targetUser.email.toLowerCase()) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        return res.status(400).json({ error: "Valid email address is required" });
      }
      const trimmedEmail = email.trim().toLowerCase();
      const existingUser = await getPrisma().user.findFirst({
        where: {
          email: { equals: trimmedEmail, mode: "insensitive" },
          NOT: { id: targetUser.id },
        },
      });

      if (existingUser) {
        return res.status(409).json({ error: "A user account with this email address already exists." });
      }
      updatedEmail = trimmedEmail;
    }

    const updatedData: any = {};
    if (name && typeof name === "string" && name.trim().length > 0) {
      updatedData.name = name.trim();
    }
    updatedData.email = updatedEmail;
    if (role && ["REQUESTER", "IT_STAFF", "ADMINISTRATOR"].includes(role)) {
      updatedData.role = role as Role;
    }
    if (typeof isActive === "boolean") {
      updatedData.isActive = isActive;
    }

    const updatedUser = await getPrisma().user.update({
      where: { id: targetUser.id },
      data: updatedData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
        updatedAt: true,
      },
    });

    if (updatedUser.isActive === false) {
      sessionStore.destroyUserSessions(targetUser.id);
    }

    return res.status(200).json({ user: updatedUser });
  } catch (error) {
    return res.status(500).json({ error: "Failed to update user" });
  }
});

// POST /api/admin/users/:id/reset-password - Reset initial password (AC-15, BR-06, BR-07)
adminUsersRouter.post("/:id/reset-password", async (req: Request, res: Response) => {
  try {
    const authUser = await requireAdmin(req, res);
    if (!authUser) return;

    const { id } = req.params;
    const { initialPassword } = req.body || {};

    const targetUser = await getPrisma().user.findUnique({
      where: { id },
    });

    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!initialPassword || typeof initialPassword !== "string") {
      return res.status(400).json({ error: "Initial password is required" });
    }

    const complexityCheck = validatePasswordComplexity(initialPassword);
    if (!complexityCheck.isValid) {
      return res.status(400).json({ error: complexityCheck.reason || "Password complexity check failed" });
    }

    const passwordHash = bcrypt.hashSync(initialPassword, 10);

    await getPrisma().user.update({
      where: { id: targetUser.id },
      data: {
        passwordHash,
        mustChangePassword: true,
      },
    });

    sessionStore.destroyUserSessions(targetUser.id);

    return res.status(200).json({
      message: "Initial password reset successfully",
      userId: targetUser.id,
      mustChangePassword: true,
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to reset password" });
  }
});
