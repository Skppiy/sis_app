const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export function getToken() {
  return localStorage.getItem("access_token");
}

export function setToken(t) {
  localStorage.setItem("access_token", t);
}

export function logout() {
  localStorage.removeItem("access_token");
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Accept": "application/json", ...authHeaders() },
  });
  if (!res.ok) throw await res.json().catch(() => ({ detail: res.statusText }));
  return res.json();
}

export async function apiPost(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw await res.json().catch(() => ({ detail: res.statusText }));
  return res.json();
}

// FastAPI OAuth2 password flow expects x-www-form-urlencoded with username/password
export async function login(email, password) {
  const body = new URLSearchParams();
  body.set("username", email);
  body.set("password", password);

  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Accept": "application/json", "Content-Type": "application/x-www-form-urlencoded" },
    body
  });

  if (!res.ok) {
    let msg = `${res.status} ${res.statusText}`;
    try { const j = await res.json(); msg = j.detail || JSON.stringify(j); } catch {}
    throw new Error(msg);
  }
  const data = await res.json();
  setToken(data.access_token || data.token || "");
  return data;
}
