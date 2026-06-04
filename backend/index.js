const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");

const app = express();
app.use(cors());
app.use(express.json());

let db;

async function initDb() {
  let retries = 10;
  while (retries > 0) {
    try {
      db = await mysql.createConnection({
        host: process.env.DB_HOST || "db",
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || "todouser",
        password: process.env.DB_PASSWORD || "todopassword",
        database: process.env.DB_NAME || "tododb",
      });

      await db.execute(`
        CREATE TABLE IF NOT EXISTS todos (
          id INT AUTO_INCREMENT PRIMARY KEY,
          title TEXT NOT NULL,
          done BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      console.log("Database ready.");
      return;
    } catch (err) {
      console.log(`DB not ready, retrying... (${retries} left)`);
      retries--;
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  console.error("Could not connect to DB.");
  process.exit(1);
}

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.get("/todos", async (req, res) => {
  const [rows] = await db.execute("SELECT * FROM todos ORDER BY created_at DESC");
  res.json(rows);
});

app.post("/todos", async (req, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ error: "Title is required" });
  const [result] = await db.execute(
    "INSERT INTO todos (title) VALUES (?)",
    [title]
  );
  const [rows] = await db.execute("SELECT * FROM todos WHERE id = ?", [result.insertId]);
  res.status(201).json(rows[0]);
});

app.patch("/todos/:id", async (req, res) => {
  const { id } = req.params;
  await db.execute("UPDATE todos SET done = NOT done WHERE id = ?", [id]);
  const [rows] = await db.execute("SELECT * FROM todos WHERE id = ?", [id]);
  if (rows.length === 0) return res.status(404).json({ error: "Not found" });
  res.json(rows[0]);
});

app.delete("/todos/:id", async (req, res) => {
  const { id } = req.params;
  await db.execute("DELETE FROM todos WHERE id = ?", [id]);
  res.status(204).send();
});

initDb().then(() => {
  app.listen(3000, () => console.log("Backend running on port 3000"));
});
