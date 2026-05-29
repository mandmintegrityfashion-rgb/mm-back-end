import { getIronSession } from "iron-session";

function normalizeSecret(value) {
  const normalized = String(value || "").trim();

  if (
    normalized.length >= 2 &&
    ((normalized.startsWith('"') && normalized.endsWith('"')) ||
      (normalized.startsWith("'") && normalized.endsWith("'")))
  ) {
    return normalized.slice(1, -1).trim();
  }

  return normalized;
}

function getSessionPassword() {
  const configuredSecret =
    normalizeSecret(process.env.SESSION_SECRET) ||
    normalizeSecret(process.env.SESSION_PASSWORD) ||
    normalizeSecret(process.env.IRON_SESSION_PASSWORD) ||
    normalizeSecret(process.env.NEXTAUTH_SECRET);

  if (configuredSecret) {
    return configuredSecret;
  }

  if (process.env.NODE_ENV !== "production") {
    return "dev_only_session_secret_change_me_before_production_123";
  }

  return "";
}

function assertValidSessionPassword(password) {
  if (password.length < 32) {
    const error = new Error(
      "A session secret of at least 32 characters is required. Set SESSION_SECRET, SESSION_PASSWORD, IRON_SESSION_PASSWORD, or NEXTAUTH_SECRET."
    );
    error.statusCode = 500;
    throw error;
  }
}

export const sessionOptions = {
  password: "",
  cookieName: "oma_session",
  ttl: 60 * 60 * 12,
  cookieOptions: {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
  },
};

function shouldUseSecureCookies(req) {
  if (process.env.NODE_ENV !== "production") {
    return false;
  }

  const forwardedProto = String(req.headers?.["x-forwarded-proto"] || "")
    .split(",")[0]
    .trim()
    .toLowerCase();
  const forwardedSsl = String(req.headers?.["x-forwarded-ssl"] || "")
    .trim()
    .toLowerCase();

  return (
    forwardedProto === "https" ||
    forwardedSsl === "on" ||
    req.socket?.encrypted === true
  );
}

function getSessionOptionsForRequest(req) {
  const password = getSessionPassword();
  assertValidSessionPassword(password);

  return {
    ...sessionOptions,
    password,
    cookieOptions: {
      ...sessionOptions.cookieOptions,
      secure: shouldUseSecureCookies(req),
    },
  };
}

// Helper wrapper for API routes
export function withSessionRoute(handler) {
  return async (req, res) => {
    try {
      req.session = await getIronSession(req, res, getSessionOptionsForRequest(req));
      return await handler(req, res);
    } catch (error) {
      if (res.headersSent) {
        throw error;
      }

      const statusCode = error?.statusCode || 500;
      return res.status(statusCode).json({
        error: error?.message || "Internal Server Error",
      });
    }
  };
}

export function requireAuthenticatedSession(req) {
  if (!req.session?.user) {
    const error = new Error("Authentication required");
    error.statusCode = 401;
    throw error;
  }

  return req.session.user;
}

export function requireAdminSession(req) {
  const user = requireAuthenticatedSession(req);

  if (!user.isAdmin) {
    const error = new Error("Admin access required");
    error.statusCode = 403;
    throw error;
  }

  return user;
}
