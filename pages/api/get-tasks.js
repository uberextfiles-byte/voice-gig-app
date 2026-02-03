import { google } from "googleapis";

export default async function handler(req, res) {
  try {
    if (!process.env.GOOGLE_CLIENT_EMAIL)
      return res.status(500).json({ error: "Missing GOOGLE_CLIENT_EMAIL" });

    if (!process.env.GOOGLE_PRIVATE_KEY)
      return res.status(500).json({ error: "Missing GOOGLE_PRIVATE_KEY" });

    if (!process.env.GOOGLE_SHEET_ID)
      return res.status(500).json({ error: "Missing GOOGLE_SHEET_ID" });

    const auth = new google.auth.JWT(
      process.env.GOOGLE_CLIENT_EMAIL,
      null,
      (process.env.GOOGLE_PRIVATE_KEY || "")
        .split("\\n")
        .join("\n"),
      ["https://www.googleapis.com/auth/spreadsheets.readonly"]
    );

    const sheets = google.sheets({ version: "v4", auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "GIG_TASKS!A2:D"
    });

    const rows = response.data.values || [];

    const tasks = rows
      .filter(r => r[2] === "YES")
      .map(r => ({
        text: r[1],
        max: Number(r[3]) || 60
      }));

    return res.status(200).json(tasks);

  } catch (error) {
    console.error("TASKS ERROR:", error);
    return res.status(500).json({ error: error.message });
  }
}
