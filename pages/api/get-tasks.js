import { google } from "googleapis";

export default async function handler(req, res) {
  try {
    const auth = new google.auth.JWT(
      process.env.GOOGLE_CLIENT_EMAIL,
      null,
      process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
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

    res.status(200).json(tasks);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
}
