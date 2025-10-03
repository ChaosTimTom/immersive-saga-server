// auth.js
import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {
  const bearer = req.headers.authorization || "";
  const token = bearer.startsWith("Bearer ") ? bearer.slice(7) : null;
  const fallback = req.headers["x-saga-token"]; // optional shared token
  if (token) {
    try { req.user = jwt.verify(token, process.env.JWT_SECRET); return next(); }
    catch {}
  }
  if (fallback && fallback === process.env.SAGA_API_TOKEN) {
    req.user = { id: "service", role: "system" };
    return next();
  }
  return res.status(401).json({ error: "Unauthorized" });
}
