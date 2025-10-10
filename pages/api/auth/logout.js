import { withSessionRoute } from "@/lib/session";

export default withSessionRoute(async function handler(req, res) {
  req.session.destroy();
  res.json({ ok: true });
});
