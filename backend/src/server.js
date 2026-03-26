import { clerkMiddleware, requireAuth } from "@clerk/express";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import initDB from "./models/initDb.js";
import tasksrouter from "./routes/tasks.route.js";
import usersRouter from "./routes/users.route.js";
import notesRouter from "./routes/notes.route.js";
dotenv.config();

const PORT = process.env.PORT || 5000;
const app = express();

app.use(cors());
app.use(express.json());
// app.use(clerkMiddleware());
app.use("/api/tasks", tasksrouter);
app.use("/api/users", usersRouter);
app.use("/api/notes", notesRouter);
app.use("/api/aws", (await import("./routes/aws.route.js")).default);
app.get("/", (req, res) => {
  res.send("Chronel API running 🚀");
});
await initDB();
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
