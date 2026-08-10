const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

// There's only ever one admin (the business owner), and their credentials
// now come straight from environment variables rather than being stored
// in the database. This means rotating the password is just "change the
// env var and restart" -- no re-seeding step needed.
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "owner@example.com").trim().toLowerCase();
const ADMIN_PASSWORD_HASH = bcrypt.hashSync(process.env.ADMIN_PASSWORD || "change-this-password", 10);

function requireAdmin(req, res, next) {
  const token = req.cookies?.session;
  if (!token) {
    return res.status(401).json({ detail: "Please log in to continue." });
  }
  try {
    const payload = jwt.verify(token, SECRET);
    if (payload.role !== "admin") {
      return res.status(403).json({ detail: "You don't have access to this." });
    }
    req.admin = payload;
    next();
  } catch {
    return res.status(401).json({ detail: "Your session has expired. Please log in again." });
  }
}

module.exports = { requireAdmin, SECRET, ADMIN_EMAIL, ADMIN_PASSWORD_HASH };
