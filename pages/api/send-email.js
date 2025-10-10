// pages/api/send-email.js
import nodemailer from "nodemailer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Only POST requests allowed" });
  }

  const { to, subject, customer } = req.body;

  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: `"Oma Hub" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: #f9fafb; border-radius: 10px; max-width: 600px; margin: auto; border: 1px solid #e5e7eb;">
          <h2 style="color: #111827; text-align: center;">Thank you for your order, ${customer.name}!</h2>
          <p style="color: #374151;">Here are the details of your order:</p>
          
          <p><strong>Order ID:</strong> ${customer.orderId}</p>
          <p><strong>Status:</strong> ${customer.status}</p>
          
          <h3 style="margin-top: 20px; color: #111827;">Products</h3>
          <ul style="list-style: none; padding: 0; color: #374151;">
            ${customer.products
              .map(
                (p) => `
                  <li style="margin-bottom: 6px;">
                    ${p.name} x ${p.quantity} = ${new Intl.NumberFormat("en-NG", {
                      style: "currency",
                      currency: "NGN",
                    }).format(Number(p.price) * Number(p.quantity))}
                  </li>
                `
              )
              .join("")}
          </ul>

          <p style="margin-top: 15px; font-size: 16px;">
            <strong>Total:</strong> ${new Intl.NumberFormat("en-NG", {
              style: "currency",
              currency: "NGN",
            }).format(Number(customer.total))}
          </p>

          <div style="margin-top: 25px; text-align: center;">
            <a href="https://yourdomain.com/orders/${customer.orderId}" 
               style="padding: 12px 20px; background: #22c55e; color: white; border-radius: 6px; text-decoration: none; font-weight: bold;">
              View Order
            </a>
          </div>

          <p style="margin-top: 30px; color: #6b7280; font-size: 12px; text-align: center;">
            If you have any questions, reply to this email. Thank you for shopping with Oma Hub!
          </p>
        </div>
      `,
    });

    return res.status(200).json({ message: "Email sent", info });
  } catch (err) {
    console.error("Nodemailer Error:", err);
    return res
      .status(500)
      .json({ message: "Email failed to send", error: err.message });
  }
}
