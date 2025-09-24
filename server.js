const express = require("express");
const bodyParser = require("body-parser");
const { Pool } = require("pg"); // PostgreSQL client
const cors = require("cors");

const app = express();
app.use(bodyParser.json());
app.use(cors()); // Optional, allows browser access

// Render PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// --- Helper: validate input ---
function validatePlay({ song, timestamp }) {
  if (typeof song !== "string" || !song.trim()) return "Invalid song";
  if (!timestamp || isNaN(Date.parse(timestamp))) return "Invalid timestamp";
  return null;
}

// --- POST /upload endpoint ---
app.post("/upload", async (req, res) => {
  const { song, timestamp } = req.body;
  const error = validatePlay({ song, timestamp });
  if (error) return res.status(400).send(error);

  try {
    await pool.query(
      "INSERT INTO plays (song, timestamp) VALUES ($1, $2)",
      [song.trim(), timestamp]
    );
    res.send("✅ Saved to cloud DB");
  } catch (err) {
    console.error("DB insert error:", err.message);
    res.status(500).send("Error saving data");
  }
});

// --- GET /plays endpoint with pagination ---
app.get("/plays", async (req, res) => {
  const limit = parseInt(req.query.limit) || 100;
  try {
    const result = await pool.query(
      "SELECT * FROM plays ORDER BY timestamp DESC LIMIT $1",
      [limit]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("DB read error:", err.message);
    res.status(500).send("Error retrieving data");
  }
});

// --- Graceful shutdown ---
process.on("SIGINT", () => {
  pool.end(() => {
    console.log("DB pool closed");
    process.exit(0);
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
