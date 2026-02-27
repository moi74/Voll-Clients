import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";

const db = new Database("pilates.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    status TEXT DEFAULT 'Ativo',
    plan TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Seed data if empty
const count = db.prepare("SELECT COUNT(*) as count FROM students").get() as { count: number };
if (count.count === 0) {
  const seedStudents = [
    ['Ana Oliveira', 'ana@email.com', '(11) 98888-1111', 'Ativo', 'Anual'],
    ['Bruno Santos', 'bruno@email.com', '(11) 98888-2222', 'Ativo', 'Mensal'],
    ['Carla Lima', 'carla@email.com', '(11) 98888-3333', 'Experimental', 'Trimestral'],
    ['Daniel Costa', 'daniel@email.com', '(11) 98888-4444', 'Ativo', 'Semestral'],
    ['Elena Rocha', 'elena@email.com', '(11) 98888-5555', 'Inativo', 'Mensal'],
  ];

  const insert = db.prepare("INSERT INTO students (name, email, phone, status, plan) VALUES (?, ?, ?, ?, ?)");
  seedStudents.forEach(s => insert.run(...s));
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/students", (req, res) => {
    const students = db.prepare("SELECT * FROM students ORDER BY created_at DESC").all();
    res.json(students);
  });

  app.post("/api/students", (req, res) => {
    const { name, email, phone, status, plan } = req.body;
    const info = db.prepare(
      "INSERT INTO students (name, email, phone, status, plan) VALUES (?, ?, ?, ?, ?)"
    ).run(name, email, phone, status || 'Ativo', plan);
    
    const newStudent = db.prepare("SELECT * FROM students WHERE id = ?").get(info.lastInsertRowid);
    res.status(201).json(newStudent);
  });

  app.delete("/api/students/:id", (req, res) => {
    db.prepare("DELETE FROM students WHERE id = ?").run(req.params.id);
    res.status(204).send();
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`VOLL Candidate running on http://localhost:${PORT}`);
  });
}

startServer();
