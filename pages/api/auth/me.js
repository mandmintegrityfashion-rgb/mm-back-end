import { withSessionRoute } from "@/lib/session";

export default withSessionRoute(async function handler(req, res) {
  res.json({ user: req.session.user || null });
});
