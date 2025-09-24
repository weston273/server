const express = require("express");
const bodyParser = require("body-parser");
const sqlite3 = require("sqlite3").verbose();
const { Pool } = require("pg"); // PostgreSQL client

const app = express();
app.use(bodyParser.json());

// connect to Render PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // Render gives this env var
  ssl: { rejectUnauthorized: false },
});

// Pi sends recognized play
app.post("/upload", async (req, res) => {
  const { song, timestamp } = req.body;
  if (!song || !timestamp) return res.status(400).send("Missing fields");

  try {
    await pool.query(
      "INSERT INTO plays (song, timestamp) VALUES ($1, $2)",
      [song, timestamp]
    );
    res.send("Saved to cloud DB ✅");
  } catch (err) {
    console.error("DB insert error:", err.message);
    res.status(500).send("Error saving data");
  }
});

// For viewing plays
app.get("/plays", async (req, res) => {
  const result = await pool.query("SELECT * FROM plays ORDER BY timestamp DESC");
  res.json(result.rows);
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on ${port}`));
