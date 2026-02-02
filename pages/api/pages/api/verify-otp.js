import { otpStore } from "./send-otp";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { email, otp } = req.body;

  const record = otpStore[email];

  if (!record) {
    return res.status(400).json({ success: false });
  }

  if (record.expires < Date.now()) {
    delete otpStore[email];
    return res.status(400).json({ success: false, message: "Expired" });
  }

  if (record.otp === otp) {
    delete otpStore[email];
    return res.status(200).json({ success: true });
  }

  return res.status(400).json({ success: false });
}
