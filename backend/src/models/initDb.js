import pool from "../db/index.js";

const initDB = async () => {
  try {
    // USERS
    await pool.query(`
CREATE TABLE IF NOT EXISTS users (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

  clerk_id TEXT UNIQUE NOT NULL,

  public_id UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,

  name TEXT,
  email TEXT UNIQUE,
  gender TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);
`);

    // TASKS
    await pool.query(`
CREATE TABLE IF NOT EXISTS tasks (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

  clerk_id TEXT NOT NULL,

  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  status TEXT,
  priority TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);
`);

    // TAGS
    await pool.query(`
CREATE TABLE IF NOT EXISTS tags (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);
`);

    // TASK_TAGS
    await pool.query(`
      CREATE TABLE IF NOT EXISTS task_tags (
        task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
        tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
        PRIMARY KEY(task_id, tag_id)
      );
    `);

    // USER PREFERENCES
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_preferences (
        user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        theme TEXT DEFAULT 'dark'
      );
    `);

    console.log("✅ Tables created successfully");
  } catch (err) {
    console.error(err);
  }
};

export default initDB;
