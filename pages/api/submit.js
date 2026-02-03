export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ success: false, message: "Missing fields" });
  }

  console.log("New submission:", { name, email });

  return res.status(200).json({ success: true });
}
