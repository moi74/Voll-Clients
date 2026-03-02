import express from "express";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

// Supabase client initialization
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase credentials missing. API routes will fail until configured.");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/students", async (req, res) => {
    try {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .order("created_at", { ascending: false });

      console.log(data)

      if (error) throw error;
      res.json(data || []);
    } catch (error: any) {
      console.error("Error fetching students:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/students", async (req, res) => {
    try {
      const { name, email, phone, status, plan } = req.body;
      const { data, error } = await supabase
        .from("students")
        .insert([{ name, email, phone, status: status || "Ativo", plan }])
        .select()
        .single();

      if (error) throw error;
      res.status(201).json(data);
    } catch (error: any) {
      console.error("Error adding student:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/students/:id", async (req, res) => {
    try {
      const { error } = await supabase
        .from("students")
        .delete()
        .eq("id", req.params.id);

      if (error) throw error;
      res.status(204).send();
    } catch (error: any) {
      console.error("Error deleting student:", error);
      res.status(500).json({ error: error.message });
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
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`VOLL Candidate (Supabase) running on http://localhost:${PORT}`);
  });
}

startServer();
