import type { NextFunction, Request, Response } from "express";

export interface AuthenticatedUser {
  id: string;
  handle: string;
  role: "user" | "admin";
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

const normalizeRole = (value: unknown): "user" | "admin" => {
  return String(value || "").toLowerCase() === "admin" ? "admin" : "user";
};

const normalizeHandle = (value: unknown, fallback: string): string => {
  const handle = String(value || fallback)
    .trim()
    .replace(/^@+/, "")
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 40);
  return handle || fallback;
};

const parseBearerDevelopmentToken = (header: string | undefined): Partial<AuthenticatedUser> => {
  if (!header || !header.startsWith("Bearer ")) return {};
  const token = header.slice("Bearer ".length).trim();
  if (!token) return {};

  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const parsed = JSON.parse(decoded) as Partial<AuthenticatedUser>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (_error) {
    return {};
  }
};

export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  const bearer = parseBearerDevelopmentToken(req.header("authorization"));
  const id = String(req.header("x-user-id") || bearer.id || "").trim();
  if (!id) {
    res.status(401).json({
      error:
        "Authentication required. Send X-User-Id and X-User-Handle from the current signed-in session.",
    });
    return;
  }

  req.user = {
    id,
    handle: normalizeHandle(req.header("x-user-handle") || bearer.handle, `user_${id.slice(0, 8)}`),
    role: normalizeRole(req.header("x-user-role") || bearer.role),
  };
  next();
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (req.user?.role !== "admin") {
    res.status(403).json({ error: "Admin access required." });
    return;
  }
  next();
};
