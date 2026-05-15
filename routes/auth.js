// ──────────────────────────────────────────────
//  FreshCart — Auth Routes (Server-Side)
//  Shared admin accounts across all clients
// ──────────────────────────────────────────────

const express = require("express");
const router = express.Router();
const { admins } = require("../data/store");

/* Simple hash for password (same algorithm as the old client-side one) */
function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h = ((h << 5) - h) + ch;
    h |= 0;
  }
  return "h_" + Math.abs(h).toString(36);
}

// POST /api/auth/signup — create a new admin account
router.post("/signup", (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: "All fields are required" });
  }
  if (password.length < 6) {
    return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
  }

  const emailLower = email.trim().toLowerCase();
  if (admins.find(a => a.email === emailLower)) {
    return res.status(409).json({ success: false, message: "An admin with this email already exists" });
  }

  const admin = {
    id: Date.now(),
    name: name.trim(),
    email: emailLower,
    passwordHash: hash(password),
    createdAt: new Date().toISOString(),
  };
  admins.push(admin);

  // Return admin info (no hash)
  res.json({
    success: true,
    message: "Account created",
    data: { id: admin.id, name: admin.name, email: admin.email },
  });
});

// POST /api/auth/signin — log in with email + password
router.post("/signin", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email and password are required" });
  }

  const emailLower = email.trim().toLowerCase();
  const admin = admins.find(a => a.email === emailLower);

  if (!admin) {
    return res.status(401).json({ success: false, message: "No admin account found with this email" });
  }
  if (admin.passwordHash !== hash(password)) {
    return res.status(401).json({ success: false, message: "Incorrect password" });
  }

  res.json({
    success: true,
    message: "Sign in successful",
    data: { id: admin.id, name: admin.name, email: admin.email },
  });
});

module.exports = router;
