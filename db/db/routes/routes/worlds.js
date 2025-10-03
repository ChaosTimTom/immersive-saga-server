// routes/worlds.js
import { Router } from "express";
import { v4 as uuid } from "uuid";
import { World, WorldMember, WorldInvite, JoinRequest, WorldState } from "../db/models.js";
import { requireAuth } from "../auth.js";

export const worlds = Router();

// Create world (owner = requester)
worlds.post("/", requireAuth, async (req, res) => {
  const name = (req.body?.name || "World").toString();
  const world = await World.create({ owner_id: req.user.id, name });
  await WorldMember.create({ world_id: world.id, player_id: req.user.id, role: "owner" });
  await WorldState.create({ world_id: world.id, version: 0, data: {} });
  res.json(world);
});

// Owner sends invite
worlds.post("/:worldId/invites", requireAuth, async (req, res) => {
  const { worldId } = req.params; const { to_player_id } = req.body || {};
  const world = await World.findByPk(worldId);
  if (!world || world.owner_id !== req.user.id) return res.status(403).json({ error: "Not owner" });
  const memberCount = await WorldMember.count({ where: { world_id: worldId, left_at: null } });
  if (memberCount >= world.max_slots) return res.status(409).json({ error: "World is full (4/4)" });
  const invite = await WorldInvite.create({
    world_id: worldId, from_player_id: req.user.id, to_player_id, token: uuid(),
    expires_at: new Date(Date.now() + 24*60*60*1000)
  });
  res.json(invite);
});

// Invite accept/decline
worlds.post("/:worldId/invites/:inviteId/:action(accept|decline)", requireAuth, async (req, res) => {
  const { worldId, inviteId, action } = req.params;
  const inv = await WorldInvite.findByPk(inviteId);
  if (!inv || inv.world_id !== worldId || inv.to_player_id !== req.user.id) return res.status(404).json({ error: "Not found" });
  if (new Date(inv.expires_at) < new Date()) { inv.status="expired"; await inv.save(); return res.status(410).json({ error: "Invite expired" }); }

  if (action === "accept") {
    const world = await World.findByPk(worldId);
    const memberCount = await WorldMember.count({ where: { world_id: worldId, left_at: null } });
    if (memberCount >= world.max_slots) return res.status(409).json({ error: "World is full (4/4)" });
    await WorldMember.findOrCreate({ where: { world_id: worldId, player_id: req.user.id }, defaults: { role: "member" } });
    inv.status="accepted"; await inv.save(); return res.json({ ok:true });
  } else { inv.status="declined"; await inv.save(); return res.json({ ok:true }); }
});

// Player requests to join
worlds.post("/:worldId/join-requests", requireAuth, async (req, res) => {
  const { worldId } = req.params;
  const jr = await JoinRequest.create({ world_id: worldId, from_player_id: req.user.id });
  res.json(jr);
});

// Owner approves/denies join request
worlds.post("/:worldId/join-requests/:reqId/:action(approve|deny)", requireAuth, async (req, res) => {
  const { worldId, reqId, action } = req.params;
  const world = await World.findByPk(worldId);
  if (!world || world.owner_id !== req.user.id) return res.status(403).json({ error: "Not owner" });
  const jr = await JoinRequest.findByPk(reqId);
  if (!jr || jr.world_id !== worldId) return res.status(404).json({ error: "Not found" });

  if (action === "approve") {
    const memberCount = await WorldMember.count({ where: { world_id: worldId, left_at: null } });
    if (memberCount >= world.max_slots) return res.status(409).json({ error: "World is full (4/4)" });
    await WorldMember.findOrCreate({ where: { world_id: worldId, player_id: jr.from_player_id }, defaults: { role: "member" } });
    jr.status="approved"; jr.handled_by=req.user.id; await jr.save(); return res.json({ ok:true });
  } else { jr.status="denied"; jr.handled_by=req.user.id; await jr.save(); return res.json({ ok:true }); }
});

// Owner kicks a member
worlds.post("/:worldId/kick", requireAuth, async (req, res) => {
  const { worldId } = req.params; const { player_id } = req.body || {};
  const world = await World.findByPk(worldId);
  if (!world || world.owner_id !== req.user.id) return res.status(403).json({ error: "Not owner" });
  const wm = await WorldMember.findOne({ where: { world_id: worldId, player_id } });
  if (!wm || wm.role === "owner") return res.status(400).json({ error: "Cannot kick owner or non-member" });
  wm.left_at = new Date(); await wm.save(); res.json({ ok:true });
});
