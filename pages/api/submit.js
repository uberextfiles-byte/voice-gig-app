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
      [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive"
      ]
    );

    const sheets = google.sheets({ version: "v4", auth });
    const drive = google.drive({ version: "v3", auth });

    // ---------------- GET EXISTING SUBMISSIONS ----------------

    const existing = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "SUBMISSIONS!A2:Z"
    });

    const rows = existing.data.values || [];

    let fraud = [];

    rows.forEach(r => {
      if (r[2] === data.email) fraud.push("DUP_EMAIL");
      if (r[15] === data.browserId) fraud.push("DUP_BROWSER");
    });

    if (data.submitTime < 30) fraud.push("TOO_FAST");

    const audioHash = crypto
      .createHash("sha256")
      .update((data.audios || []).join(""))
      .digest("hex");

    rows.forEach(r => {
      if (r[16] === audioHash) fraud.push("DUP_AUDIO");
    });

    // ---------------- CREATE DRIVE FOLDER ----------------

    const folder = await drive.files.create({
      requestBody: {
        name: `${data.email}_${Date.now()}`,
        mimeType: "application/vnd.google-apps.folder"
      },
      fields: "id"
    });

    const folderId = folder.data.id;

    // ---------------- UPLOAD AUDIO FILES ----------------

    let audioLinks = [];

    for (let i = 0; i < (data.audios || []).length; i++) {
      const buffer = Buffer.from(data.audios[i], "base64");

      const file = await drive.files.create({
        requestBody: {
          name: `T${i + 1}.webm`,
          parents: [folderId]
        },
        media: {
          mimeType: "audio/webm",
          body: buffer
        },
        fields: "id"
      });

      await drive.permissions.create({
        fileId: file.data.id,
        requestBody: {
          role: "reader",
          type: "anyone"
        }
      });

      audioLinks.push(
        `https://drive.google.com/file/d/${file.data.id}/view`
      );
    }

    // ---------------- BUILD SHEET ROW ----------------

    const row = [
      new Date().toISOString(), // Timestamp
      data.name,
      data.email,
      "", "", "", "", "", "", "", // reserved fields
      audioLinks[0] || "",
      audioLinks[1] || "",
      audioLinks[2] || "",
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
