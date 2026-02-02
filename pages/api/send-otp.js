export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email required" });
  }

  // Temporary fake OTP (we will improve this)
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  console.log("Generated OTP:", otp);

  return res.status(200).json({ success: true, otp });
}
