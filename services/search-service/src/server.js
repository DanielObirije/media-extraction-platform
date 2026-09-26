const express = require("express");
const path = require("path");
const { getJson } = require("serpapi");
const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");
const { SQSClient, SendMessageCommand } = require("@aws-sdk/client-sqs");
const crypto = require("crypto");

require("dotenv").config();

const API_KEY = process.env.API_KEY;
const AWS_REGION = process.env.AWS_REGION;
const TABLE_NAME = process.env.TABLE_NAME;
const QUEUE_URL = process.env.QUEUE_URL;

const dynamo = new DynamoDBClient({
  region: AWS_REGION,
});

const sqs = new SQSClient({
  region: AWS_REGION,
});

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname,"..", "public")));

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

app.post("api/dowload", async (req, res) => {
  try {
    const { url, title } = req.body;
    if (!url) {
      return res.status(400).json({
        error: "URL is required",
      });
    }
    const jobId = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    await dynamo.send(
      new PutItemCommand({
        TableName: TABLE_NAME,
        Item: {
          jobId: jobId,
          url: url,
          title: title,
          status: "QUEUED",
          createdAt: createdAt,
        },
      }),
    );

    await sqs.send(
      new SendMessageCommand({
        QueueUrl: QUEUE_URL,
        MessageBody: JSON.stringify({
          jobId,
          url,
          title: title,
        }),
      }),
    );

    res.status(202).json({
      success: true,
      jobId,
      status: "QUEUED",
    });
  } catch (error) {
    console.error("Failed to create download job:", error);
    res.status(500).json({
      error: "Failed to create download job",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Search service running on port ${PORT}`);
});
