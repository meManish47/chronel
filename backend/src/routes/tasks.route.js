import express from "express";
import pool from "../db/index.js";

const router = express.Router();

// GET ALL TASKS
router.get("/", async (req, res) => {
  const { rows } = await pool.query(
    "SELECT * FROM tasks WHERE clerk_id = $1 ORDER BY created_at DESC",
    [req.query.clerk_id],
  );
  res.json(rows);
});

// ADD TASK
router.post("/", async (req, res) => {
  const { clerk_id, title, description, due_date, priority, tags } = req.body;
  const tagNames = tags?.map((tag) => tag.name) || [];
  const { rows } = await pool.query(
    `INSERT INTO tasks 
    (clerk_id, title, description, due_date, priority, status, tags)
    VALUES ($1, $2, $3, $4::DATE, $5, 'pending', $6)
    RETURNING *`,
    [clerk_id, title, description, due_date, priority, tagNames || []],
  );

  const task = rows[0];

  res.json({
    id: task.id,
    title: task.title,
    description: task.description,
    dueDate: task.due_date,
    status: task.status,
    priority: task.priority,
    tags: task.tags,
    createdAt: task.created_at,
  });
});

// UPDATE TASK
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { title, description, status } = req.body;

  const { rows } = await pool.query(
    `UPDATE tasks
     SET title=$1, description=$2, status=$3
     WHERE id=$4 RETURNING *`,
    [title, description, status, id],
  );

  res.json(rows[0]);
});

// DELETE TASK
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  await pool.query("DELETE FROM tasks WHERE id=$1", [id]);
  res.sendStatus(204);
});

// UPDATE TASK STATUS
router.patch("/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const { rows } = await pool.query(
    `UPDATE tasks
     SET status=$1
      WHERE id=$2 RETURNING *`,
    [status, id],
  );
  res.json(rows[0]);
});

export default router;
