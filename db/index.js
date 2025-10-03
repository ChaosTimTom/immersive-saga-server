// db/index.js
import { Sequelize } from "sequelize";

export const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  logging: false,
  dialectOptions: process.env.NODE_ENV === "production" ? { ssl: { require: true } } : undefined,
});

export async function initDb() {
  await sequelize.authenticate();
}
