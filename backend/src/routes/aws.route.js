import { CreateBucketCommand } from "@aws-sdk/client-s3";
import express from "express";
const router = express.Router();

const { S3Client, ListBucketsCommand } = await import("@aws-sdk/client-s3");

const s3 = new S3Client({
  region: "ap-south-1",
  credentials: {
    accessKeyId: process.env.VITE_AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.VITE_AWS_SECRET || "",
  },
});

router.get("/test", (req, res) => {
  res.json({ message: "AWS route is working!" });
});
router.get("/buckets", async (req, res) => {
  try {
    const data = await s3.send(new ListBucketsCommand({}));
    

    res.json({ buckets: data.Buckets });
  } catch (err) {
    console.error("Error listing buckets:", err);
    res.status(500).json({ error: "Error listing buckets" });
  }
});

router.get("/upload-url", async (req, res) => {
  try {
    const fileName = req.query.fileName ;

    const command = new PutObjectCommand({
      Bucket: "amzn-s3-chronel-bucket",
      Key: fileName,
      ContentType: "image/jpeg",
    });

    const url = await getSignedUrl(s3, command, { expiresIn: 60 });

    res.json({ url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate upload URL" });
  }
});

export default router;
