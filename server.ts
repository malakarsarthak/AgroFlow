import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db: any;
try {
  const dbPath = path.join(__dirname, "agroflow.db");
  db = new Database(dbPath);
  // Initialize database
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      farmName TEXT
    )
  `);
  console.log("Database initialized successfully");
  const test = db.prepare("SELECT 1").get();
  console.log("Database test query:", test);
} catch (err) {
  console.error("Database initialization failed, falling back to memory:", err);
  db = new Database(":memory:");
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      farmName TEXT
    )
  `);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/register", (req, res) => {
    console.log("Registration request received:", req.body);
    const { name, email, password, farmName } = req.body;
    
    if (!name || !email || !password) {
      console.log("Registration failed: Missing fields");
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      const id = Date.now().toString(36) + Math.random().toString(36).substring(2);
      console.log("Generated ID:", id);
      const stmt = db.prepare("INSERT INTO users (id, name, email, password, farmName) VALUES (?, ?, ?, ?, ?)");
      const result = stmt.run(id, name, email, password, farmName || null);
      console.log("Insert result:", result);
      
      res.json({ id, name, email, farmName });
    } catch (err: any) {
      console.error("Registration error details:", err);
      if (err.code === "SQLITE_CONSTRAINT") {
        res.status(400).json({ error: "Email already registered" });
      } else {
        res.status(500).json({ error: `Internal server error: ${err.message}` });
      }
    }
  });

  app.post("/api/login", (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Missing email or password" });
    }

    const user = db.prepare("SELECT * FROM users WHERE email = ? AND password = ?").get(email, password) as any;

    if (user) {
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } else {
      res.status(401).json({ error: "Invalid email or password" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
