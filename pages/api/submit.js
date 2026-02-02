export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const data = req.body;

    if (!data) {
      return res.status(400).json({ message: "No data received" });
    }

    console.log("Received submission:", data);

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}
