// routes/social.js
import { Router } from "express";
import { Player, Friendship } from "../db/models.js";
import { requireAuth } from "../auth.js";

export const social = Router();

// simple exact-handle search (swap to ILIKE later for partial)
social.get("/players/search", requireAuth, async (req, res) => {
  const q = (req.query.handle || "").toString();
  if (!q) return res.json([]);
  const players = await Player.findAll({ where: { handle: q } });
  res.json(players.map(p => ({ id: p.id, handle: p.handle, display_name: p.display_name })));
});

social.post("/friends/request", requireAuth, async (req, res) => {
  const { to_player_id } = req.body || {};
  if (!to_player_id) return res.status(400).json({ error: "Missing to_player_id" });
  const fr = await Friendship.create({ player_id: req.user.id, friend_id: to_player_id, status: "pending" });
  res.json(fr);
});

social.post("/friends/accept", requireAuth, async (req, res) => {
  const { friendship_id } = req.body || {};
  const fr = await Friendship.findByPk(friendship_id);
  if (!fr || fr.friend_id !== req.user.id) return res.status(404).json({ error: "Not found" });
  fr.status = "accepted"; await fr.save();
  res.json(fr);
});

social.post("/friends/block", requireAuth, async (req, res) => {
  const { player_id } = req.body || {};
  const fr = await Friendship.findOne({ where: { player_id: req.user.id, friend_id: player_id } });
  if (fr) { fr.status = "blocked"; await fr.save(); }
  else { await Friendship.create({ player_id: req.user.id, friend_id: player_id, status: "blocked" }); }
  res.json({ ok: true });
});
