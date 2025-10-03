// db/models.js
import { DataTypes } from "sequelize";
import { sequelize } from "./index.js";

/** Players & Social */
export const Player = sequelize.define("Player", {
  id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  handle: { type: DataTypes.STRING, unique: true, allowNull: false },
  display_name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, unique: true, allowNull: true },
  password_hash: { type: DataTypes.STRING, allowNull: true },
  is_online: { type: DataTypes.BOOLEAN, defaultValue: false },
  last_seen_at: { type: DataTypes.DATE },
}, { tableName: "players", underscored: true });

export const Friendship = sequelize.define("Friendship", {
  id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  player_id: { type: DataTypes.UUID, allowNull: false },
  friend_id: { type: DataTypes.UUID, allowNull: false },
  status: { type: DataTypes.ENUM("pending","accepted","blocked"), defaultValue: "pending" },
}, { tableName: "friendships", underscored: true });

/** Worlds & Membership */
export const World = sequelize.define("World", {
  id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  owner_id: { type: DataTypes.UUID, allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false },
  visibility: { type: DataTypes.ENUM("private"), defaultValue: "private" },
  max_slots: { type: DataTypes.INTEGER, defaultValue: 4 },
  status: { type: DataTypes.ENUM("active","archived"), defaultValue: "active" },
}, { tableName: "worlds", underscored: true });

export const WorldMember = sequelize.define("WorldMember", {
  id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  world_id: { type: DataTypes.UUID, allowNull: false },
  player_id: { type: DataTypes.UUID, allowNull: false },
  role: { type: DataTypes.ENUM("owner","member","banned"), defaultValue: "member" },
  joined_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  left_at: { type: DataTypes.DATE, allowNull: true },
}, { tableName: "world_members", underscored: true });

WorldMember.belongsTo(World, { foreignKey: "world_id" });
WorldMember.belongsTo(Player, { foreignKey: "player_id" });

/** Invites & Join Requests */
export const WorldInvite = sequelize.define("WorldInvite", {
  id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  world_id: { type: DataTypes.UUID, allowNull: false },
  from_player_id: { type: DataTypes.UUID, allowNull: false },
  to_player_id: { type: DataTypes.UUID, allowNull: false },
  token: { type: DataTypes.STRING, allowNull: false },
  status: { type: DataTypes.ENUM("pending","accepted","declined","expired"), defaultValue: "pending" },
  expires_at: { type: DataTypes.DATE, allowNull: false },
}, { tableName: "world_invites", underscored: true });

export const JoinRequest = sequelize.define("JoinRequest", {
  id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  world_id: { type: DataTypes.UUID, allowNull: false },
  from_player_id: { type: DataTypes.UUID, allowNull: false },
  status: { type: DataTypes.ENUM("pending","approved","denied"), defaultValue: "pending" },
  handled_by: { type: DataTypes.UUID, allowNull: true },
}, { tableName: "join_requests", underscored: true });

/** World State / Scenes / Action Log */
export const WorldState = sequelize.define("WorldState", {
  id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  world_id: { type: DataTypes.UUID, allowNull: false },
  version: { type: DataTypes.INTEGER, defaultValue: 0 },
  data: { type: DataTypes.JSONB, defaultValue: {} },
}, { tableName: "world_states", underscored: true });

export const Scene = sequelize.define("Scene", {
  id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  world_id: { type: DataTypes.UUID, allowNull: false },
  title: { type: DataTypes.STRING, allowNull: false },
  summary: { type: DataTypes.TEXT, defaultValue: "" },
  timeline: { type: DataTypes.STRING, defaultValue: "" },
}, { tableName: "scenes", underscored: true });

export const ActionLog = sequelize.define("ActionLog", {
  id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  world_id: { type: DataTypes.UUID, allowNull: false },
  player_id: { type: DataTypes.UUID, allowNull: true },
  character_id: { type: DataTypes.UUID, allowNull: true },
  type: { type: DataTypes.ENUM("human","ghost"), defaultValue: "human" },
  payload: { type: DataTypes.JSONB, defaultValue: {} },
}, { tableName: "action_logs", underscored: true });

Scene.belongsTo(World, { foreignKey: "world_id" });
ActionLog.belongsTo(World, { foreignKey: "world_id" });

export async function syncModels() { await sequelize.sync(); }
