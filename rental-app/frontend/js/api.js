// Small helper around fetch() so every page talks to the API the same way.
const api = {
  async request(path, options = {}) {
    const res = await fetch(`${SITE_CONFIG.API_BASE}${path}`, {
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      ...options,
    });

    let data = null;
    try {
      data = await res.json();
    } catch {
      /* no body */
    }

    if (!res.ok) {
      const message = data?.detail || "Something went wrong. Please try again.";
      throw new Error(message);
    }
    return data;
  },

  get(path) {
    return this.request(path);
  },
  post(path, body) {
    return this.request(path, { method: "POST", body: JSON.stringify(body) });
  },
  put(path, body) {
    return this.request(path, { method: "PUT", body: JSON.stringify(body) });
  },
  delete(path) {
    return this.request(path, { method: "DELETE" });
  },
};
