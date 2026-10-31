import { Request } from "express";
import { getPrisma } from "../prisma.js";
import { sessionStore } from "../services/sessionStore.js";

/**
 * Helper to resolve authenticated user strictly from active session
 */
export async function resolveAuthUser(req: Request) {
  const token = sessionStore.extractToken(req);
  if (!token) return null;

  const session = sessionStore.getSession(token);
  if (!session) return null;

  const user = await getPrisma().user.findUnique({ where: { id: session.userId } });
  if (!user || !user.isActive) return null;

  return user;
}
