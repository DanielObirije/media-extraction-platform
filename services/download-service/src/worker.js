const path = require("path");
const fs = require("fs");
const os = require("os");
const { execFile } = require("child_process");
const { promisify } = require("util");

const {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
} = require("@aws-sdk/client-sqs");

const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const AWS_REGION = process.env.AWS_REGION;
const QUEUE_URL = process.env.QUEUE_URL;
const S3_BUCKET = process.env.S3_BUCKET;

const app = express();
const PORT = 4000;

const sqs = new SQSClient({
  AWS_REGION: AWS_REGION,
});

const s3 = new S3Client({
  AWS_REGION: AWS_REGION,
});

const DOWNLOADS_DIR = path.join(__dirname, "downloads");

if (!fs.existsSync(DOWNLOADS_DIR)) {
  fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
}

async function downloadVideo(url, jobId) {
  const outputTemplate = path.join(DOWNLOADS_DIR, `${jobId}.%(ext)s`);
  await execFile(
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
  );

  const files = fs
    .readdirSync(DOWNLOADS_DIR)
    .filter((file) => file.startsWith(`${jobId}`));

  if (files.length === 0) {
    throw new Error("Downloaded file was not found");
  }
  return path.join(DOWNLOADS_DIR, files[0]);

  //   (error, stdout, stderr) => {
  //     if (error) {
  //       console.error("yt-dlp error:", stderr);

  //       return res.status(500).json({
  //         error: "Failed to download video",
  //         details: stderr,
  //       });
  //     }

  //     const files = fs.readdirSync(DOWNLOADS_DIR);

  //     const downloaded = files.find((file) => file.startsWith(safeName));

  //     if (!downloaded) {
  //       return res.status(500).json({
  //         error: "Download completed but file was not found",
  //       });
  //     }

  //     res.json({
  //       success: true,
  //       filename: downloaded,
  //       path: `/downloads/${downloaded}`,
  //     });
  //   },
  // );
}
