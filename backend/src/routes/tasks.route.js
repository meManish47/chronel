import express from "express";
import pool from "../db/index.js";

const router = express.Router();

// GET ALL TASKS
router.get("/", async (req, res) => {
  const clerk_id = req.query.clerk_id;
  const user = await pool.query("SELECT * FROM users WHERE clerk_id = $1", [
    clerk_id,
  ]);
  // console.log("User found:", user.rows[0]);
  if (user.rows.length === 0) {
    return res.status(404).json({ error: "User not found" });
  }
  const { rows } = await pool.query(
    "SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC",
    [user.rows[0].id],
  );
  res.json(rows);
});

// ADD TASK
router.post("/", async (req, res) => {
  const { clerk_id, title, description, due_date, priority, tags } = req.body;
  const user = await pool.query("SELECT * FROM users WHERE clerk_id = $1", [
    clerk_id,
  ]);
  if (user.rows.length === 0) {
    return res.status(404).json({ error: "User not found" });
  }

  // const tagNames = tags?.map((tag) => tag.name) || [];
  // console.log("Received tags:", tagNames);
  // console.log("Received tags object:", tags);
  const { rows } = await pool.query(
    `INSERT INTO tasks 
    (user_id, title, description, due_date, priority, status, tags)
    VALUES ($1, $2, $3, $4::DATE, $5, 'pending', $6)
    RETURNING *`,
    [user.rows[0].id, title, description, due_date, priority, tags || []],
  );

  const task = rows[0];

  res.json({
    id: task.id,
    user_id: task.user_id,
    title: task.title,
    description: task.description,
    due_date: task.due_date,
    status: task.status,
    priority: task.priority,
    tags: task.tags,
    created_at: task.created_at,
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
