/* ─────────────────────────────────────────────
   FreshCart — Admin Authentication System
   Server-backed auth with localStorage session
   ───────────────────────────────────────────── */

const Auth = {
  _sessionKey: "freshcart_admin_session",

  /* ── Sign Up (calls server API) ──────────── */
  async signUp(name, email, password) {
    if (!name || !email || !password) {
      throw new Error("All fields are required");
    }
    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);

    // Save session locally + save credentials for cross-site convenience
    this._setSession(json.data);
    this._saveCredentials(email, password);
    return json.data;
  },

  /* ── Sign In (calls server API) ──────────── */
  async signIn(email, password) {
    if (!email || !password) {
      throw new Error("Email and password are required");
    }

    const res = await fetch("/api/auth/signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);

    // Save session locally + save credentials for cross-site convenience
    this._setSession(json.data);
    this._saveCredentials(email, password);
    return json.data;
  },

  /* ── Sign Out ─────────────────────────────── */
  signOut() {
    localStorage.removeItem(this._sessionKey);
  },

  /* ── Session (localStorage) ────────────────── */
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

  /* ── Credential Storage (for cross-site login) ── */
  _credKey: "freshcart_saved_credentials",

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
