import express from "express";
import pool from "../db/index.js";

const router = express.Router();

// GET ALL TASKS
router.get("/", async (req, res) => {
  const { rows } = await pool.query(
    "SELECT * FROM tasks ORDER BY created_at DESC",
  );
  res.json(rows);
});

// ADD TASK
router.post("/", async (req, res) => {
  const { userId, title, description, due_date, priority } = req.body;
  console.log("due date received:", due_date, typeof due_date);
  const { rows } = await pool.query(
    `INSERT INTO tasks (user_id, title, description, due_date, priority)
   VALUES ($1, $2, $3, $4::DATE, $5)
   RETURNING *`,
    [1, title, description, due_date, priority],
  );
  // res.json(rows[0]);
  const task = rows[0];
  console.log("Created Task:", task);
  res.json({
    id: task.id,
    title: task.title,
    description: task.description,
    dueDate: task.due_date,
    status: task.status,
    priority: task.priority,
    userId: task.user_id,
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
