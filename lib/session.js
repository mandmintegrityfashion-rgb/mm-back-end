import { getIronSession } from "iron-session";

export const sessionOptions = {
  password: process.env.SESSION_SECRET || "complex_password_at_least_32_characters_long",
  cookieName: "oma_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
  },
};

// Helper wrapper for API routes
export function withSessionRoute(handler) {
  return async (req, res) => {
    req.session = await getIronSession(req, res, sessionOptions);
    return handler(req, res);
  };
}
