// server.js
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import OpenAI from "openai";

import { initDb } from "./db/index.js";
import { syncModels, Player } from "./db/models.js";
import { social } from "./routes/social.js";
import { worlds } from "./routes/worlds.js";

const app = express();
app.use(cors());
app.use(express.json());

// REST routes
app.use("/api", social);
app.use("/api/worlds", worlds);

// OpenAI client
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Simple health route + legacy player-action route
app.get("/", (_req, res) => res.send("Saga server is up"));
app.post("/player-action", async (req, res) => {
  const { inputText } = req.body || {};
  if (!inputText) return res.status(400).json({ error: "Missing inputText" });
  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: inputText }],
    });
    res.json({ narration: completion.choices[0].message.content });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "AI request failed" });
  }
});

// HTTP server + Socket.IO
const server = http.createServer(app);
const io = new SocketIOServer(server, { cors: { origin: "*" } });

io.on("connection", (socket) => {
  socket.on("world:subscribe", async ({ worldId, playerId }) => {
    socket.join(worldId);
    const p = await Player.findByPk(playerId);
    if (p) { p.is_online = true; p.last_seen_at = new Date(); await p.save(); }
    io.to(worldId).emit("world:presence", { playerId, status: "online" });
  });
});

// Boot
const PORT = process.env.PORT || 3000;
const start = async () => {
  await initDb();
  await syncModels();
  server.listen(PORT, () => console.log(`Server on :${PORT}`));
};
start();
