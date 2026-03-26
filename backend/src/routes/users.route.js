import express from "express";
import pool from "../db/index.js";

const router = express.Router();

router.post("/sync", async (req, res) => {
  const { clerkId, name, email } = req.body;

  if (!clerkId || !email) {
    return res.status(400).json({ error: "Missing user data" });
  }

  try {
    const result = await pool.query(
      `
      INSERT INTO users (clerk_id, name, email)
      VALUES ($1, $2, $3)
      ON CONFLICT (clerk_id)
      DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email
      RETURNING *;
      `,
      [clerkId, name, email]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "DB error" });
  }
});

export default router;