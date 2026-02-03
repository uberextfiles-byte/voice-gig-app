import { google } from "googleapis";
import crypto from "crypto";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const data = req.body;

    if (!data.emailVerified) {
      return res.status(400).json({ message: "Email not verified" });
    }

    const auth = new google.auth.JWT(
      process.env.GOOGLE_CLIENT_EMAIL,
      null,
      process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      ["https://www.googleapis.com/auth/spreadsheets"]
    );

    const sheets = google.sheets({ version: "v4", auth });

    // Get existing submissions
    const existing = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "SUBMISSIONS!A2:Z"
    });

    const rows = existing.data.values || [];

    let fraud = [];

    // Duplicate email
    rows.forEach(r => {
      if (r[2] === data.email) fraud.push("DUP_EMAIL");
      if (r[15] === data.browserId) fraud.push("DUP_BROWSER");
    });

    // Too fast
    if (data.submitTime < 30) fraud.push("TOO_FAST");

    // Audio hash
    const audioHash = crypto
      .createHash("sha256")
      .update((data.audios || []).join(""))
      .digest("hex");

    rows.forEach(r => {
      if (r[16] === audioHash) fraud.push("DUP_AUDIO");
    });

    // Build submission row
    const row = [
      new Date().toISOString(),
      data.name,
      data.email,
      "", "", "", "", "", "", "", // reserved columns
      "", "", "", // audio links (Drive later)
      fraud.length ? "FLAGGED" : "Pending",
      "",
      data.browserId,
      audioHash,
      data.submitTime,
      fraud.length ? fraud.join(",") : "CLEAN",
      "YES",
      "YES"
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "SUBMISSIONS!A:Z",
      valueInputOption: "RAW",
      requestBody: {
        values: [row]
      }
    });

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
}
