import express from "express";
import multer from "multer";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import pool from "../db/index.js";
import axios from "axios";
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const s3 = new S3Client({
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.VITE_AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.VITE_AWS_SECRET || "",
  },
});

const BUCKET = process.env.AWS_BUCKET_NAME || "amzn-s3-chronel-bucket";

// ─── helpers ────────────────────────────────────────────────────────────────

async function resolveDbUser(clerkId) {
  const result = await pool.query("SELECT id FROM users WHERE clerk_id = $1", [
    clerkId,
  ]);
  return result.rows[0] ?? null;
}

async function freshSignedUrl(s3Key) {
  return getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: BUCKET, Key: s3Key }),
    { expiresIn: 604800 }, // 7 days
  );
}

// ─── POST /api/notes/upload ──────────────────────────────────────────────────
// multipart/form-data fields: file (binary), clerkId, title, s3Key
router.post("/upload", upload.single("file"), async (req, res) => {
  const { clerkId, title, s3Key } = req.body;
  const file = req.file;

  if (!clerkId || !title || !s3Key || !file) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  try {
    const user = await resolveDbUser(clerkId);
    if (!user) return res.status(404).json({ error: "User not found." });

    // Upload raw buffer — no JSON serialisation overhead
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: s3Key,
        Body: file.buffer,
        ContentType: file.mimetype,
        Metadata: {
          "user-id": String(user.id),
          title,
        },
      }),
    );

    // Presigned URL valid for 7 days — works for private buckets in the viewer
    const file_url = await freshSignedUrl(s3Key);

    const { rows } = await pool.query(
      `INSERT INTO notes (user_id, title, file_key, file_url)
       VALUES ($1, $2, $3, $4)
       RETURNING id, title, file_key, file_url, created_at`,
      [user.id, title, s3Key, file_url],
    );
    // CALLING FastApi
    axios
      .post("http://127.0.0.1:8000/api/pdf/process", {
        file_url: file_url,
        note_id: rows[0].id,
        clerk_id: clerkId,
      })
      .then(() => {
        console.log("FastAPI processing started");
      })
      .catch((err) => {
        console.error("FastAPI error:", err.message);
      });
    return res.status(201).json(rows[0]);
  } catch (err) {
    console.error("Upload error:", err);
    return res.status(500).json({ error: "Upload failed." });
  }
});

// ─── GET /api/notes?clerk_id=xxx ─────────────────────────────────────────────
// Returns all notes for the user, newest first.
// Refreshes presigned URLs on every fetch so they never expire in the UI.
router.get("/", async (req, res) => {
  const { clerk_id } = req.query;
  if (!clerk_id) return res.status(400).json({ error: "clerk_id required." });

  try {
    const user = await resolveDbUser(clerk_id);
    if (!user) return res.status(404).json({ error: "User not found." });

    const { rows } = await pool.query(
      `SELECT id, title, file_key, file_url, created_at
       FROM notes
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [user.id],
    );

    // Refresh every presigned URL so the viewer always gets a valid link
    const notes = await Promise.all(
      rows.map(async (note) => ({
        ...note,
        file_url: await freshSignedUrl(note.file_key),
      })),
    );

    return res.json(notes);
  } catch (err) {
    console.error("Fetch notes error:", err);
    return res.status(500).json({ error: "DB error." });
  }
});

// ─── GET /api/notes/:id/url?clerk_id=xxx ─────────────────────────────────────
// Returns a fresh presigned URL for a single note.
// Call this from the viewer if the URL expires mid-session.
router.get("/:id/url", async (req, res) => {
  const { id } = req.params;
  const { clerk_id } = req.query;
  if (!clerk_id) return res.status(400).json({ error: "clerk_id required." });

  try {
    const user = await resolveDbUser(clerk_id);
    if (!user) return res.status(404).json({ error: "User not found." });

    const { rows } = await pool.query(
      "SELECT file_key FROM notes WHERE id = $1 AND user_id = $2",
      [id, user.id],
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Note not found." });
    }

    const file_url = await freshSignedUrl(rows[0].file_key);
    return res.json({ file_url });
  } catch (err) {
    console.error("Refresh URL error:", err);
    return res.status(500).json({ error: "Failed to refresh URL." });
  }
});

// ─── DELETE /api/notes/:id ───────────────────────────────────────────────────
// Removes the record from DB and deletes the object from S3.
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const { rows } = await pool.query(
      "SELECT file_key FROM notes WHERE id = $1",
      [id],
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Note not found." });
    }

    const { file_key } = rows[0];

    // Remove from S3 first — if this fails we keep the DB record intact
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: file_key }));

    await pool.query("DELETE FROM notes WHERE id = $1", [id]);

    return res.sendStatus(204);
  } catch (err) {
    console.error("Delete error:", err);
    return res.status(500).json({ error: "Delete failed." });
  }
});

export default router;
