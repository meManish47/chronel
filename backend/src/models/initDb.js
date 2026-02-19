import pool from "../db/index.js";

const initDB = async () => {
  try {

    // USERS
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        gender TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // TASKS
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        due_date DATE,
        status TEXT DEFAULT 'pending',
        priority TEXT DEFAULT 'Medium',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // TAGS
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tags (
        id SERIAL PRIMARY KEY,
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
