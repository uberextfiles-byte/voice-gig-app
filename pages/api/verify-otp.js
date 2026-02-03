export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { otp } = req.body;

  if (!otp) {
    return res.status(400).json({ message: "OTP is required" });
  }

  // Temporary simple logic
  if (otp === "123456") {
    return res.status(200).json({ success: true });
  }

  return res.status(400).json({ success: false, message: "Invalid OTP" });
}
