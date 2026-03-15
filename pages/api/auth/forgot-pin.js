import { mongooseConnect } from "@/lib/mongoose";
import User from "@/models/User";
import crypto from "crypto";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  await mongooseConnect();

  try {
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal whether email exists
      return res.json({ ok: true, message: "If this email is registered, a reset code has been sent." });
    }

    // Generate a 6-digit reset code
    const resetCode = crypto.randomInt(100000, 999999).toString();
    const resetExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    user.resetCode = resetCode;
    user.resetExpiry = resetExpiry;
    await user.save();

    // Send email with reset code
    const nodemailer = require("nodemailer");
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"M&M Fashion" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "M&M Fashion — PIN Reset Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 30px; border: 1px solid #e5e7eb; border-radius: 12px;">
          <h2 style="color: #1e40af; margin-bottom: 10px;">M&M Fashion</h2>
          <p style="color: #374151;">Hi <strong>${user.username}</strong>,</p>
          <p style="color: #374151;">Your PIN reset code is:</p>
          <div style="text-align: center; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2563eb; background: #eff6ff; padding: 12px 24px; border-radius: 8px;">${resetCode}</span>
          </div>
          <p style="color: #6b7280; font-size: 14px;">This code expires in 15 minutes. If you didn't request this, please ignore this email.</p>
        </div>
      `,
    });

    return res.json({ ok: true, message: "If this email is registered, a reset code has been sent." });
  } catch (err) {
    console.error("Forgot PIN error:", err);
    return res.status(500).json({ error: "Failed to process request" });
  }
}
