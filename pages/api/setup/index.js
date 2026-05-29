import { mongooseConnect } from "@/lib/mongoose";
import { requireAdminSession, withSessionRoute } from "@/lib/session";
import { Setup } from "@/models/Setup";

function normalizeString(value) {
  return String(value || "").trim();
}

function normalizeArrayStrings(values) {
  if (!Array.isArray(values)) {
    return [];
  }

  return values.map((value) => normalizeString(value)).filter(Boolean);
}

function normalizeAdmins(admins) {
  if (!Array.isArray(admins)) {
    return [];
  }

  return admins
    .map((admin) => ({
      name: normalizeString(admin?.name),
      email: normalizeString(admin?.email).toLowerCase(),
    }))
    .filter((admin) => admin.name && admin.email);
}

export default withSessionRoute(async function handler(req, res) {
  requireAdminSession(req);
  await mongooseConnect();

  if (req.method === "GET") {
    try {
      const setup = await Setup.findOne({}).lean();
      return res.json(setup || {});
    } catch (err) {
      console.error("GET /setup error:", err);
      return res.status(500).json({ error: "Failed to fetch setup" });
    }
  }

  if (req.method === "POST") {
    try {
      const storeName = normalizeString(req.body?.storeName);
      const storePhone = normalizeString(req.body?.storePhone);
      const country = normalizeString(req.body?.country);
      const locations = normalizeArrayStrings(req.body?.locations);
      const admins = normalizeAdmins(req.body?.admins);
      const sales = req.body?.sales || {};
      const heroPages = Array.isArray(req.body?.heroPages) ? req.body.heroPages : [];
      const logo = normalizeString(req.body?.logo);
      const currency = normalizeString(req.body?.currency || "NGN") || "NGN";

      if (!storeName) {
        return res.status(400).json({ error: "Store name is required" });
      }

      let setup = await Setup.findOne({});
      if (setup) {
        // update
        setup.storeName = storeName;
        setup.storePhone = storePhone;
        setup.country = country;
        setup.locations = locations;
        setup.admins = admins;
        setup.sales = sales;
        setup.heroPages = heroPages;
        setup.logo = logo;
        setup.currency = currency;
        await setup.save();
        return res.json({ message: "Setup updated", setup });
      } else {
        // create
        setup = await Setup.create({
          storeName,
          storePhone,
          country,
          locations,
          admins,
          sales,
          heroPages,
          logo,
          currency,
        });
        return res.json({ message: "Setup created", setup });
      }
    } catch (err) {
      console.error("POST /setup error:", err);
      return res.status(500).json({ error: "Failed to save setup" });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
});
