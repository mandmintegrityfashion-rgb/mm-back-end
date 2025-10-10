import { mongooseConnect } from "@/lib/mongoose";
import { Setup } from "@/models/Setup";

export default async function handler(req, res) {
  await mongooseConnect();

  if (req.method === "GET") {
    try {
      const setup = await Setup.findOne({});
      return res.json(setup || {});
    } catch (err) {
      console.error("GET /setup error:", err);
      return res.status(500).json({ error: "Failed to fetch setup" });
    }
  }

  if (req.method === "POST") {
    try {
      const {
        storeName,
        storePhone,
        country,
        locations,
        admins,
        sales,
        heroPages,
        logo,
        currency = "NGN",
      } = req.body;

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
}
