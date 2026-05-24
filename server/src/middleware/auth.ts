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

const importJose = async (): Promise<any> => {
  return new Function("specifier", "return import(specifier)")("jose");
};

const isProductionRuntime = (): boolean => {
  return process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
};

const allowDevelopmentHeaders = (): boolean => {
  if (process.env.ALLOW_DEVELOPMENT_AUTH_HEADERS === "true") return true;
  if (process.env.ALLOW_DEVELOPMENT_AUTH_HEADERS === "false") return false;
  return !isProductionRuntime();
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

let remoteJwks: unknown;

const verifyWithSupabaseUserEndpoint = async (token: string): Promise<Partial<AuthenticatedUser>> => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseApiKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const fetchImpl = (globalThis as any).fetch;
  if (!supabaseUrl || !supabaseApiKey || !fetchImpl) return {};

  const response = await fetchImpl(`${supabaseUrl.replace(/\/+$/, "")}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: supabaseApiKey,
      Accept: "application/json",
    },
  });
  if (!response.ok) return {};

  const payload = (await response.json()) as Record<string, unknown>;
  const metadata =
    payload.user_metadata && typeof payload.user_metadata === "object"
      ? (payload.user_metadata as Record<string, unknown>)
      : {};
  const appMetadata =
    payload.app_metadata && typeof payload.app_metadata === "object"
      ? (payload.app_metadata as Record<string, unknown>)
      : {};
  const id = String(payload.id || "").trim();
  if (!id) return {};
  return {
    id,
    handle: normalizeHandle(metadata.handle || payload.email || `user_${id.slice(0, 8)}`, `user_${id.slice(0, 8)}`),
    role: normalizeRole(appMetadata.role || metadata.role || payload.role),
  };
};

const verifyBearerJwt = async (header: string | undefined): Promise<Partial<AuthenticatedUser>> => {
  if (!header || !header.startsWith("Bearer ")) return {};
  const token = header.slice("Bearer ".length).trim();
  if (!token) return {};

  const jose = await importJose();
  const verifyOptions: Record<string, unknown> = {};
  if (process.env.AUTH_JWT_ISSUER) verifyOptions.issuer = process.env.AUTH_JWT_ISSUER;
  if (process.env.AUTH_JWT_AUDIENCE) verifyOptions.audience = process.env.AUTH_JWT_AUDIENCE;

  let verification;
  try {
    if (process.env.AUTH_JWKS_URL) {
      if (!remoteJwks) {
        remoteJwks = jose.createRemoteJWKSet(new URL(process.env.AUTH_JWKS_URL));
      }
      verification = await jose.jwtVerify(token, remoteJwks, verifyOptions);
    } else if (process.env.AUTH_JWT_SECRET) {
      verification = await jose.jwtVerify(token, new TextEncoder().encode(process.env.AUTH_JWT_SECRET), verifyOptions);
    }
  } catch (error) {
    const supabaseUser = await verifyWithSupabaseUserEndpoint(token);
    if (supabaseUser.id) return supabaseUser;
    throw error;
  }

  if (!verification) {
    const supabaseUser = await verifyWithSupabaseUserEndpoint(token);
    if (supabaseUser.id) return supabaseUser;
  }

  if (!verification) {
    if (allowDevelopmentHeaders()) {
      return parseBearerDevelopmentToken(header);
    }
    throw new Error("Authentication verifier is not configured for production.");
  }

  const payload = verification.payload || {};
  const appMetadata =
    payload.app_metadata && typeof payload.app_metadata === "object"
      ? (payload.app_metadata as Record<string, unknown>)
      : {};
  const userMetadata =
    payload.user_metadata && typeof payload.user_metadata === "object"
      ? (payload.user_metadata as Record<string, unknown>)
      : {};
  const id = String(payload.sub || payload.user_id || payload.id || "").trim();
  return {
    id,
    handle: normalizeHandle(
      payload.preferred_username ||
        payload.handle ||
        userMetadata.handle ||
        payload.email ||
        (id ? `user_${id.slice(0, 8)}` : "member"),
      id ? `user_${id.slice(0, 8)}` : "member"
    ),
    role: normalizeRole(payload.role || appMetadata.role || userMetadata.role),
  };
};

const authenticateRequest = async (req: Request): Promise<AuthenticatedUser> => {
  const bearer = await verifyBearerJwt(req.header("authorization"));
  const allowHeaderFallback = allowDevelopmentHeaders();
  const id = String((allowHeaderFallback ? req.header("x-user-id") : "") || bearer.id || "").trim();
  if (!id) {
    throw new Error("Authentication required.");
  }

  return {
    id,
    handle: normalizeHandle(
      (allowHeaderFallback ? req.header("x-user-handle") : "") || bearer.handle,
      `user_${id.slice(0, 8)}`
    ),
    role: normalizeRole((allowHeaderFallback ? req.header("x-user-role") : "") || bearer.role),
  };
};

export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  authenticateRequest(req)
    .then((user) => {
      req.user = user;
      next();
    })
    .catch((error) => {
      const message = error instanceof Error ? error.message : "Authentication required.";
      res.status(message.includes("not configured") ? 500 : 401).json({
        error:
          message === "Authentication required."
            ? "Authentication required. Send a verified Bearer token, or enable development auth headers outside production."
            : message,
      });
    });
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (req.user?.role !== "admin") {
    res.status(403).json({ error: "Admin access required." });
    return;
  }
  next();
};
