import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { getPrisma } from "../prisma.js";
import { sessionStore } from "../services/sessionStore.js";
import { validatePasswordComplexity } from "../utils/passwordValidation.js";

export const authRouter = Router();

// BR-08: Cache-Control: no-store on all auth endpoints
authRouter.use((_req: Request, res: Response, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

// AC-01, AC-16, BR-01, BR-08: POST /api/auth/login
authRouter.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body || {};

    if (!email || typeof email !== "string" || !password || typeof password !== "string") {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const user = await getPrisma().user.findFirst({
      where: {
        email: {
          equals: trimmedEmail,
          mode: "insensitive",
        },
      },
    });

    // BR-01, AC-16: Reject inactive user or invalid credentials without revealing account state
    if (!user || !user.isActive) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = bcrypt.compareSync(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate session token
    const token = sessionStore.createSession(user.id);

    // Set HTTP-only cookies
    const cookieOptions = "HttpOnly; Path=/; SameSite=Lax";
    res.setHeader("Set-Cookie", [
      `toktickit_session=${token}; ${cookieOptions}`,
      `session_token=${token}; ${cookieOptions}`,
    ]);

    const userProfile = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
    };

    return res.status(200).json({
      user: userProfile,
    });
  } catch (error) {
    return res.status(500).json({ error: "Authentication failed" });
  }
});

// AC-17: POST /api/auth/logout
authRouter.post("/logout", (req: Request, res: Response) => {
  const token = sessionStore.extractToken(req);
  if (token) {
    sessionStore.destroySession(token);
  }

  // Clear HTTP-only cookies
  const clearCookieOptions = "HttpOnly; Path=/; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT";
  res.setHeader("Set-Cookie", [
    `toktickit_session=; ${clearCookieOptions}`,
    `session_token=; ${clearCookieOptions}`,
  ]);

  return res.status(200).json({ message: "Logged out successfully" });
});

// GET /api/auth/me
authRouter.get("/me", async (req: Request, res: Response) => {
  try {
    const token = sessionStore.extractToken(req);
    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const session = sessionStore.getSession(token);
    if (!session) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await getPrisma().user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
      },
    });

    if (!user || !user.isActive) {
      sessionStore.destroySession(token);
      return res.status(401).json({ error: "Unauthorized" });
    }

    return res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch user context" });
  }
});

// AC-02, BR-02, BR-07: POST /api/auth/change-password
authRouter.post("/change-password", async (req: Request, res: Response) => {
  try {
    const token = sessionStore.extractToken(req);
    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const session = sessionStore.getSession(token);
    if (!session) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await getPrisma().user.findUnique({
      where: { id: session.userId },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { currentPassword, newPassword, confirmNewPassword } = req.body || {};

    if (!currentPassword || typeof currentPassword !== "string") {
      return res.status(400).json({ error: "Current password is required" });
    }

    if (!newPassword || typeof newPassword !== "string") {
      return res.status(400).json({ error: "New password is required" });
    }

    if (confirmNewPassword !== undefined && confirmNewPassword !== newPassword) {
      return res.status(400).json({ error: "New passwords do not match" });
    }

    // Verify current password
    const isMatch = bcrypt.compareSync(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid current password" });
    }

    // Validate new password complexity
    const complexityCheck = validatePasswordComplexity(newPassword);
    if (!complexityCheck.isValid) {
      return res.status(400).json({ error: complexityCheck.reason || "Password complexity check failed" });
    }

    // Hash new password and update mustChangePassword = false
    const newPasswordHash = bcrypt.hashSync(newPassword, 10);
    await getPrisma().user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
        mustChangePassword: false,
      },
    });

    return res.status(200).json({
      message: "Password updated successfully",
      mustChangePassword: false,
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to change password" });
  }
});
