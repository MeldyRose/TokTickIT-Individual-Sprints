import { Request } from "express";
import crypto from "crypto";

interface Session {
  userId: string;
  createdAt: Date;
  expiresAt: Date;
}

class SessionStore {
  private sessions = new Map<string, Session>();
  private SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

  public createSession(userId: string): string {
    const token = crypto.randomUUID();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.SESSION_TTL_MS);

    this.sessions.set(token, {
      userId,
      createdAt: now,
      expiresAt,
    });

    return token;
  }

  public getSession(token: string): Session | null {
    if (!token) return null;
    const session = this.sessions.get(token);
    if (!session) return null;

    if (new Date() > session.expiresAt) {
      this.sessions.delete(token);
      return null;
    }

    return session;
  }

  public destroySession(token: string): void {
    if (token) {
      this.sessions.delete(token);
    }
  }

  public destroyUserSessions(userId: string): void {
    if (!userId) return;
    for (const [token, session] of this.sessions.entries()) {
      if (session.userId === userId) {
        this.sessions.delete(token);
      }
    }
  }

  public extractToken(req: Request): string | null {
    // 1. Check Authorization header (Bearer <token>)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
      const token = authHeader.substring(7).trim();
      if (token) return token;
    }

    // 2. Check X-Session-Token header
    const xToken = req.headers["x-session-token"] as string;
    if (xToken && xToken.trim()) {
      return xToken.trim();
    }

    // 3. Check Cookie header
    const cookieHeader = req.headers.cookie;
    if (cookieHeader) {
      const cookies = cookieHeader.split(";").reduce((acc, cookieStr) => {
        const [key, value] = cookieStr.trim().split("=");
        if (key && value) {
          acc[key] = decodeURIComponent(value);
        }
        return acc;
      }, {} as Record<string, string>);

      if (cookies["toktickit_session"]) return cookies["toktickit_session"];
      if (cookies["session_token"]) return cookies["session_token"];
      if (cookies["token"]) return cookies["token"];
    }

    return null;
  }
}

export const sessionStore = new SessionStore();
