const express = require("express");
const path = require("path");
const fs = require("fs");
const { execFile } = require("child_process");

const app = express();
const PORT = 4000;

const DOWNLOADS_DIR = path.join(__dirname, "downloads");

if (!fs.existsSync(DOWNLOADS_DIR)) {
  fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
}

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/downloads", express.static(DOWNLOADS_DIR));

app.post("/api/download", (req, res) => {
  const { url, title } = req.body;

  if (!url) {
    return res.status(400).json({
      error: "URL is required",
    });
  }

  const safeName = (title || "video")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .substring(0, 60);

  const outputTemplate = path.join(DOWNLOADS_DIR, `${safeName}.%(ext)s`);

  execFile(
    "yt-dlp",
    [
      "-o",
      outputTemplate,
      "--no-playlist",
      "--merge-output-format",
      "mp4",
      url,
    ],
    { timeout: 120000 },
    (error, stdout, stderr) => {
      if (error) {
        console.error("yt-dlp error:", stderr);

        return res.status(500).json({
          error: "Failed to download video",
          details: stderr,
        });
      }

      const files = fs.readdirSync(DOWNLOADS_DIR);

      const downloaded = files.find((file) => file.startsWith(safeName));

      if (!downloaded) {
        return res.status(500).json({
          error: "Download completed but file was not found",
        });
      }

      res.json({
        success: true,
        filename: downloaded,
        path: `/downloads/${downloaded}`,
      });
    },
  );
});

app.listen(PORT, () => {
  console.log(`Download service running on port ${PORT}`);
});
