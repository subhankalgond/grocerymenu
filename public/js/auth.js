/* ─────────────────────────────────────────────
   FreshCart — Admin Authentication System
   Hybrid: tries server API first, falls back to
   localStorage when no backend is available
   (e.g. GitHub Pages static hosting)
   ───────────────────────────────────────────── */

const Auth = {
  _sessionKey: "freshcart_admin_session",
  _adminsKey: "freshcart_admins",
  _credKey: "freshcart_saved_credentials",

  /* ── Detect if backend API is reachable ──── */
  async _tryAPI(url, options) {
    try {
      const res = await fetch(url, options);
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        // Server returned HTML (e.g. the SPA fallback) — no real API
        return null;
      }
      return await res.json();
    } catch {
      // Network error / no server running
      return null;
    }
  },

  /* ── Simple hash (for localStorage fallback) ── */
  _hash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const ch = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + ch;
      hash |= 0;
    }
    return "h_" + Math.abs(hash).toString(36);
  },

  /* ── localStorage admin helpers ──────────── */
  _getAdmins() {
    return JSON.parse(localStorage.getItem(this._adminsKey) || "[]");
  },
  _saveAdmins(admins) {
    localStorage.setItem(this._adminsKey, JSON.stringify(admins));
  },

  /* ── Sign Up ─────────────────────────────── */
  async signUp(name, email, password) {
    if (!name || !email || !password) {
      throw new Error("All fields are required");
    }
    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }

    // Try server API first
    const json = await this._tryAPI("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    if (json) {
      // Server responded with valid JSON
      if (!json.success) throw new Error(json.message);
      this._setSession(json.data);
      this._saveCredentials(email, password);
      // Also save to localStorage so offline/static works too
      this._localSignUp(name, email, password);
      return json.data;
    }

    // Fallback: localStorage-only auth
    return this._localSignUp(name, email, password);
  },

  _localSignUp(name, email, password) {
    const admins = this._getAdmins();
    const emailLower = email.trim().toLowerCase();
    if (admins.find(a => a.email === emailLower)) {
      throw new Error("An admin with this email already exists");
    }
    const admin = {
      id: Date.now(),
      name: name.trim(),
      email: emailLower,
      passwordHash: this._hash(password),
      createdAt: new Date().toISOString(),
    };
    admins.push(admin);
    this._saveAdmins(admins);
    const data = { id: admin.id, name: admin.name, email: admin.email };
    this._setSession(data);
    this._saveCredentials(email, password);
    return data;
  },

  /* ── Sign In ─────────────────────────────── */
  async signIn(email, password) {
    if (!email || !password) {
      throw new Error("Email and password are required");
    }

    // Try server API first
    const json = await this._tryAPI("/api/auth/signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (json) {
      // Server responded with valid JSON
      if (!json.success) throw new Error(json.message);
      this._setSession(json.data);
      this._saveCredentials(email, password);
      return json.data;
    }

    // Fallback: localStorage-only auth
    return this._localSignIn(email, password);
  },

  _localSignIn(email, password) {
    const admins = this._getAdmins();
    const emailLower = email.trim().toLowerCase();
    const admin = admins.find(a => a.email === emailLower);
    if (!admin) {
      throw new Error("No admin account found with this email");
    }
    if (admin.passwordHash !== this._hash(password)) {
      throw new Error("Incorrect password");
    }
    const data = { id: admin.id, name: admin.name, email: admin.email };
    this._setSession(data);
    this._saveCredentials(email, password);
    return data;
  },

  /* ── Sign Out ────────────────────────────── */
  signOut() {
    localStorage.removeItem(this._sessionKey);
  },

  /* ── Session (localStorage) ─────────────── */
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

  /* ── Credential Storage (for auto-fill) ─── */
  _saveCredentials(email, password) {
    const creds = { email: email.trim().toLowerCase(), password };
    localStorage.setItem(this._credKey, JSON.stringify(creds));
  },

  getSavedCredentials() {
    const data = localStorage.getItem(this._credKey);
    return data ? JSON.parse(data) : null;
  },

  clearSavedCredentials() {
    localStorage.removeItem(this._credKey);
  },
};
