import express from "express";
import bodyParser from "body-parser";
import OpenAI from "openai";

const app = express();
const port = process.env.PORT || 3000;
app.use(bodyParser.json());

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

app.listen(port, () => console.log(`Saga server on :${port}`));
