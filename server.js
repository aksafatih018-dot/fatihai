import "dotenv/config";
import express from "express";
import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/status", (_req, res) => {
  res.json({ ready: Boolean(process.env.OPENAI_API_KEY) });
});

app.post("/api/chat", async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({
        error: "API belum disiapkan. Pemilik proyek perlu mengatur OPENAI_API_KEY di server."
      });
    }

    const messages = Array.isArray(req.body.messages) ? req.body.messages : [];
    const safeMessages = messages
      .filter(m => m && ["user", "assistant"].includes(m.role) && typeof m.content === "string")
      .slice(-12)
      .map(m => ({ role: m.role, content: m.content.slice(0, 6000) }));

    if (!safeMessages.length || safeMessages[safeMessages.length - 1].role !== "user") {
      return res.status(400).json({ error: "Kirim pesan terlebih dahulu." });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5.5",
      instructions: [
        "Kamu adalah FatihAi, asisten AI yang ramah, jelas, dan membantu.",
        "Jawab dalam bahasa yang digunakan pengguna, utamakan Bahasa Indonesia.",
        "Untuk pelajaran, jelaskan langkah demi langkah dan bantu pengguna memahami.",
        "Jangan mengaku telah melakukan tindakan yang sebenarnya belum dilakukan."
      ].join(" "),
      input: safeMessages
    });

    res.json({ reply: response.output_text || "Maaf, belum ada jawaban yang bisa ditampilkan." });
  } catch (error) {
    console.error("Chat API error:", error?.message || error);
    res.status(500).json({
      error: "FatihAi belum bisa menjawab. Periksa koneksi, pengaturan API, dan saldo/limit API."
    });
  }
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`FatihAi berjalan di port ${PORT}`);
});