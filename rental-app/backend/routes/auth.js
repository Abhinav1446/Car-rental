const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { requireAdmin, SECRET, ADMIN_EMAIL, ADMIN_PASSWORD_HASH } = require("../middleware/auth");

const router = express.Router();

const isProd = process.env.NODE_ENV === "production";

// Single admin login, checked against ADMIN_EMAIL / ADMIN_PASSWORD from
// environment variables (see middleware/auth.js).
router.post("/login", (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ detail: "Email and password are required." });
  }

  const emailMatches = email.trim().toLowerCase() === ADMIN_EMAIL;
  const passwordMatches = emailMatches && bcrypt.compareSync(password, ADMIN_PASSWORD_HASH);

  if (!emailMatches || !passwordMatches) {
    return res.status(401).json({ detail: "Incorrect email or password." });
  }

  const token = jwt.sign({ role: "admin", email: ADMIN_EMAIL }, SECRET, { expiresIn: "7d" });

  res.cookie("session", token, {
    httpOnly: true,
    sameSite: isProd ? "none" : "lax",
    secure: isProd,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({ email: ADMIN_EMAIL, role: "admin" });
});

router.post("/logout", (req, res) => {
  res.clearCookie("session", {
    httpOnly: true,
    sameSite: isProd ? "none" : "lax",
    secure: isProd,
  });
  res.json({ ok: true });
});

router.get("/me", requireAdmin, (req, res) => {
  res.json({ email: req.admin.email, role: "admin" });
});

module.exports = router;
