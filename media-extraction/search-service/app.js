const express = require("express");
const path = require("path");
const { getJson } = require("serpapi");
require("dotenv").config();

const app = express();
const PORT = 3000;

const API_KEY = process.env.API_KEY;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/search", (req, res) => {
  const { q, count = 5 } = req.query;

  if (!q) {
    return res.status(400).json({
      error: "Query parameter 'q' is required",
    });
  }

  getJson(
    {
      engine: "google_short_videos",
      q,
      api_key: API_KEY,
    },
    (json) => {
      if (json.error) {
        console.error("SerpAPI error:", json.error);

        return res.status(500).json({
          error: "Search failed",
        });
      }

      const videos = (json.short_video_results || []).slice(
        0,
        parseInt(count, 10),
      );

      res.json({ videos });
    },
  );
});

app.listen(PORT, () => {
  console.log(`Search service running on port ${PORT}`);
});
