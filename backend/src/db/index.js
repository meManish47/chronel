import dotenv from "dotenv";
dotenv.config();

import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
pool.on("error", (err) => {
  console.error("------------------------- error on idle client", err);
  process.exit(-1);
});
pool.on("connect", () => {
  console.log("✅ Connected to PostgreSQL using DB URL");
});

export default pool;
