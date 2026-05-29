import nodemailer from "nodemailer";
import { requireAdminSession, withSessionRoute } from "@/lib/session";

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

export default withSessionRoute(async function handler(req, res) {
  requireAdminSession(req);

  if (req.method !== "POST")
    return res.status(405).json({ message: "Method not allowed" });

  const to = String(req.body?.to || "").trim();
  const status = String(req.body?.status || "").trim();
  const customer = req.body?.customer;

  if (!to || !customer || !status)
    return res
      .status(400)
      .json({ message: "Missing recipient, status or customer info" });

  if (!isValidEmail(to)) {
    return res.status(400).json({ message: "A valid recipient email is required" });
  }

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return res.status(500).json({ message: "Email service is not configured" });
  }

  // Dynamic message setup
  let subject, header, message, color;

  switch (status.toLowerCase()) {
    case "received":
      subject = "Order Received - M&M Fashion";
      header = "Your Order Has Been Received!";
      message = `We’ve received your order <strong>${customer.orderId}</strong> and our team is preparing it for shipment.`;
      color = "#1e3a8a";
      break;
    case "shipped":
      subject = "Order Shipped - M&M Fashion";
      header = "Good News! Your Order Is On The Way 🚚";
      message = `Your order <strong>${customer.orderId}</strong> has been shipped and is on its way to you.`;
      color = "#059669";
      break;
    case "delivered":
      subject = "Order Delivered - M&M Fashion";
      header = "Your Order Has Been Delivered 🎉";
      message = `We’re excited to let you know your order <strong>${customer.orderId}</strong> has been successfully delivered.`;
      color = "#1e40af";
      break;
    default:
      subject = "Order Update - M&M Fashion";
      header = "Your Order Has Been Received!";
      message = `We’ve received your order <strong>${customer.orderId}</strong> and our team is preparing it for shipment.`;
      color = "#1e3a8a";
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const htmlBody = `
  <div style="font-family: 'Segoe UI', sans-serif; background: #f9fafb; padding: 20px;">
    <div style="max-width: 600px; margin: auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
      <div style="background: ${color}; color: white; padding: 20px; text-align: center;">
        <h2 style="margin: 0;">M&M Fashion</h2>
        <p style="margin: 0;">${header}</p>
      </div>

      <div style="padding: 25px;">
        <p>Hi <strong>${customer.name}</strong>,</p>
        <p>${message}</p>

        <h3 style="margin-top: 25px;">📦 Order Summary</h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <thead>
            <tr style="background: #f1f5f9;">
              <th style="padding: 8px; border-bottom: 1px solid #e5e7eb;">Item</th>
              <th style="padding: 8px; border-bottom: 1px solid #e5e7eb;">Qty</th>
              <th style="padding: 8px; border-bottom: 1px solid #e5e7eb;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${(customer.products || [])
              .map(
                (p) => `
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #f1f5f9;">${
                    p.name
                  }</td>
                  <td style="padding: 8px; border-bottom: 1px solid #f1f5f9;">${
                    p.quantity
                  }</td>
                  <td style="padding: 8px; border-bottom: 1px solid #f1f5f9;">₦${p.price.toLocaleString()}</td>
                </tr>
              `
              )
              .join("")}
          </tbody>
        </table>

        <p style="margin-top: 20px;"><strong>Total Paid:</strong> ₦${customer.total?.toLocaleString()}</p>
        <p><strong>Status:</strong> ${status}</p>

        <h3 style="margin-top: 25px;">📍 Delivery Details</h3>
        <p>
          ${customer.shippingDetails?.name || customer.name}<br/>
          ${customer.shippingDetails?.address || "No address provided"}<br/>
          ${customer.shippingDetails?.city || ""}<br/>
          Phone: ${customer.shippingDetails?.phone || "N/A"}
        </p>

       ${
         customer.deliveryPerson?.name || customer.deliveryPerson?.phone
           ? `
  <h3 style="margin-top: 25px;">🚚 Delivery Person</h3>
  <p>
    Name: ${customer.deliveryPerson?.name || "N/A"}<br/>
    Phone: ${customer.deliveryPerson?.phone || "N/A"}
  </p>
  `
           : ""
       }


        <p style="margin-top: 30px;">Thank you for shopping with <strong>M&M Fashion</strong>!</p>

        <p style="font-size: 12px; color: #6b7280;">If you have any questions, reply to this email or contact us at mandmintegrityfashion@gmail.com.</p>
      </div>
    </div>
  </div>
  `;

  try {
    await transporter.sendMail({
      from: `"M&M Fashion" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: htmlBody,
    });

    return res.status(200).json({ message: "Email sent successfully" });
  } catch (error) {
    console.error("Email send failed:", error);
    return res
      .status(500)
      .json({ message: "Failed to send email", error: error.message });
  }
});
