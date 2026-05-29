import { getIronSession } from "iron-session";

const sessionPassword =
  process.env.SESSION_SECRET ||
  (process.env.NODE_ENV === "production"
    ? ""
    : "dev_only_session_secret_change_me_before_production_123");

if (sessionPassword.length < 32) {
  throw new Error("SESSION_SECRET must be at least 32 characters long");
}

export const sessionOptions = {
  password: sessionPassword,
  cookieName: "oma_session",
  ttl: 60 * 60 * 12,
  cookieOptions: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  },
};

// Helper wrapper for API routes
export function withSessionRoute(handler) {
  return async (req, res) => {
    try {
      req.session = await getIronSession(req, res, sessionOptions);
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
