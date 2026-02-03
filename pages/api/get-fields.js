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
      range: "GIG_FIELDS!A2:F"
    });

    const rows = response.data.values || [];

    const fields = rows
      .filter(r => r[5] === "YES")
      .map(r => ({
        key: r[0],
        label: r[1],
        type: r[2],
        options: r[3]
      }));

    res.status(200).json(fields);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch fields" });
  }
}
