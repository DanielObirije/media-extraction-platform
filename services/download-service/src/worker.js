const path = require("path");
const fs = require("fs");
const os = require("os");
const { execFile } = require("child_process");

const {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
} = require("@aws-sdk/client-sqs");

const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const AWS_REGION = process.env.AWS_REGION;
const QUEUE_URL = process.env.QUEUE_URL;
const S3_BUCKET = process.env.S3_BUCKET;

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
  );

  const files = fs
    .readdirSync(DOWNLOADS_DIR)
    .filter((file) => file.startsWith(`${jobId}`));

  if (files.length === 0) {
    throw new Error("Downloaded file was not found");
  }
  return path.join(DOWNLOADS_DIR, files[0]);
}

async function uploadToS3(filepath, jobId) {
  const s3Key = `videos/${jobId}${extension}`;
  const fileStream = fs.createReadStream(filepath);
  await s3.PutObjectCommand(
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      key: s3Key,
      body: fileStream,
      contentType: "video/mp4",
    }),
  );
  return s3Key;
}

async function processMessage(message) {
  const job = JSON.parse(message.Body);

  const { jobId, url } = job;

  console.log(`Processing job: ${jobId}`);

  let filePath;

  try {
    filePath = await downloadVideo(url, jobId);

    console.log(`Downloaded job: ${jobId}`);

    const s3Key = await uploadToS3(filePath, jobId);

    console.log(`Uploaded job ${jobId} to s3://${S3_BUCKET}/${s3Key}`);

    fs.unlinkSync(filePath);

    console.log(`Deleted temporary file for job: ${jobId}`);

    await sqs.send(
      new DeleteMessageCommand({
        QueueUrl: QUEUE_URL,
        ReceiptHandle: message.ReceiptHandle,
      }),
    );

    console.log(`Completed job: ${jobId}`);
  } catch (error) {
    console.error(`Job ${jobId} failed:`, error);

    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}

async function pollQueue() {
  console.log("Download worker started");
  console.log("Waiting for download jobs...");

  while (true) {
    try {
      const response = await sqs.send(
        new ReceiveMessageCommand({
          QueueUrl: QUEUE_URL,

          MaxNumberOfMessages: 1,

          // Long polling
          WaitTimeSeconds: 20,

          // Give the worker enough time to download/upload
          VisibilityTimeout: 180,
        }),
      );

      const messages = response.Messages || [];

      for (const message of messages) {
        await processMessage(message);
      }
    } catch (error) {
      console.error("SQS polling error:", error);

      // Prevent rapid retry if AWS temporarily fails
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}

pollQueue().catch((error) => {
  console.error("Worker crashed:", error);
  process.exit(1);
});
