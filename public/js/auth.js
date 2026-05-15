/* ─────────────────────────────────────────────
   FreshCart — Admin Authentication System
   Sign In / Sign Up with localStorage
   ───────────────────────────────────────────── */

const Auth = {
  _adminsKey: "freshcart_admins",
  _sessionKey: "freshcart_admin_session",

  /* ── Helpers ───────────────────────────── */
  _getAdmins() {
    return JSON.parse(localStorage.getItem(this._adminsKey) || "[]");
  },
  _saveAdmins(admins) {
    localStorage.setItem(this._adminsKey, JSON.stringify(admins));
  },

  /* Simple hash for password (not cryptographically secure, but fine for demo) */
  _hash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const ch = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + ch;
      hash |= 0;
    }
    return "h_" + Math.abs(hash).toString(36);
  },

  /* ── Sign Up ──────────────────────────── */
  signUp(name, email, password) {
    if (!name || !email || !password) {
      throw new Error("All fields are required");
    }
    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }
    const admins = this._getAdmins();
    if (admins.find(a => a.email.toLowerCase() === email.toLowerCase())) {
      throw new Error("An admin with this email already exists");
    }
    const admin = {
      id: Date.now(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash: this._hash(password),
      createdAt: new Date().toISOString(),
    };
    admins.push(admin);
    this._saveAdmins(admins);
    // Auto login after signup
    this._setSession(admin);
    return admin;
  },

  /* ── Sign In ──────────────────────────── */
  signIn(email, password) {
    if (!email || !password) {
      throw new Error("Email and password are required");
    }
    const admins = this._getAdmins();
    const admin = admins.find(a => a.email === email.trim().toLowerCase());
    if (!admin) {
      throw new Error("No admin account found with this email");
    }
    if (admin.passwordHash !== this._hash(password)) {
      throw new Error("Incorrect password");
    }
    this._setSession(admin);
    return admin;
  },

  /* ── Sign Out ─────────────────────────── */
  signOut() {
    localStorage.removeItem(this._sessionKey);
  },

  /* ── Session ──────────────────────────── */
  _setSession(admin) {
    const session = {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      loggedInAt: new Date().toISOString(),
    };
    localStorage.setItem(this._sessionKey, JSON.stringify(session));
  },

  getSession() {
    const data = localStorage.getItem(this._sessionKey);
    return data ? JSON.parse(data) : null;
  },

  isLoggedIn() {
    return this.getSession() !== null;
  },
};
