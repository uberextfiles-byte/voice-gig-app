import { otpStore } from "./send-otp";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: "Missing data" });
    }

    const record = otpStore[email];

    if (!record) {
      return res.status(400).json({ success: false, message: "OTP not found" });
    }

    if (record.expires < Date.now()) {
      delete otpStore[email];
      return res.status(400).json({ success: false, message: "OTP expired" });
    }

    if (record.otp === otp) {
      delete otpStore[email];
      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ success: false, message: "Invalid OTP" });

  } catch (error) {
    console.error("Verify OTP error:", error);
    return res.status(500).json({ message: "Server error" });
  }
}
