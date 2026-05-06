import express from "express";
import axios from "axios";
import pool from "../db/index.js";

const router = express.Router();
const FASTAPI = process.env.AI_SERVICE_URL || "http://127.0.0.1:8000";

/**
 * POST /api/ai/generate-tasks
 * Body: { note_id, clerk_id }
 *
 * 1. Calls FastAPI to generate tasks from the note's chunks
 * 2. Bulk-inserts the tasks into PostgreSQL for the user
 * 3. Returns the created tasks
 */
router.post("/generate-tasks", async (req, res) => {
  const { note_id, clerk_id } = req.body;

  if (!note_id || !clerk_id) {
    return res.status(400).json({ error: "note_id and clerk_id are required." });
  }

  try {
    // ── Resolve DB user ───────────────────────────────────────────────
    const userResult = await pool.query(
      "SELECT id FROM users WHERE clerk_id = $1",
      [clerk_id]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found." });
    }
    const userId = userResult.rows[0].id;

    // ── Ask FastAPI to generate tasks ─────────────────────────────────
    const aiResponse = await axios.post(`${FASTAPI}/api/tasks/generate`, {
      note_id: Number(note_id),
    });

    const aiTasks = aiResponse.data.tasks;
    if (!Array.isArray(aiTasks) || aiTasks.length === 0) {
      return res.status(502).json({ error: "AI returned no tasks." });
    }

    // ── Bulk insert into PostgreSQL ───────────────────────────────────
    const inserted = [];
    for (const t of aiTasks) {
      const { rows } = await pool.query(
        `INSERT INTO tasks (user_id, title, description, due_date, priority, status, tags)
         VALUES ($1, $2, $3, $4::DATE, $5, 'pending', $6)
         RETURNING id, title, description, due_date, priority, status, tags, created_at`,
        [userId, t.title, t.description, t.due_date, t.priority || "medium", []]
      );
      inserted.push({
        id: rows[0].id,
        title: rows[0].title,
        description: rows[0].description,
        dueDate: rows[0].due_date,
        status: rows[0].status,
        priority: rows[0].priority,
        tags: rows[0].tags,
        createdAt: rows[0].created_at,
      });
    }

    return res.status(201).json({ tasks: inserted, count: inserted.length });
  } catch (err) {
    console.error("Generate tasks error:", err?.response?.data || err.message);
    const detail = err?.response?.data?.detail || err.message;
    return res.status(500).json({ error: detail });
  }
});

export default router;
