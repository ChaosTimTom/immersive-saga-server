import express from "express";
import bodyParser from "body-parser";
import OpenAI from "openai";
import http from "http";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Server as SocketIOServer } from "socket.io";
import { initDb } from "./db/index.js";
import { syncModels, Player } from "./db/models.js";
import { social } from "./routes/social.js";
import { worlds } from "./routes/worlds.js";


const app = express();
const port = process.env.PORT || 3000;
app.use(bodyParser.json());
dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use("/api", social);
app.use("/api/worlds", worlds);



const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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


app.listen(port, () => console.log(`Saga server on :${port}`));

const PORT = process.env.PORT || 3000;
const start = async () => {
  await initDb();
  await syncModels();
  server.listen(PORT, () => console.log(`Server on :${PORT}`));
};
start();

