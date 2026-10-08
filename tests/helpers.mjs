// Appels HTTP vers l'application lancée en local (npm run dev), avec gestion des cookies de session.
import { TEST_PASSWORD } from "./seed.mjs";

export const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

const cookieHeader = (jar) => [...jar].map(([k, v]) => `${k}=${v}`).join("; ");

const storeCookies = (jar, res) => {
  for (const c of res.headers.getSetCookie()) {
    const [pair] = c.split(";");
    const i = pair.indexOf("=");
    jar.set(pair.slice(0, i), pair.slice(i + 1));
  }
};

// Connexion NextAuth (credentials) ; renvoie l'en-tête Cookie de la session
export async function login(email, password = TEST_PASSWORD) {
  const jar = new Map();
  let res = await fetch(`${BASE_URL}/api/auth/csrf`);
  storeCookies(jar, res);
  const { csrfToken } = await res.json();

  res = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", cookie: cookieHeader(jar) },
    body: new URLSearchParams({ csrfToken, email, password, json: "true" }),
    redirect: "manual",
  });
  storeCookies(jar, res);
  return cookieHeader(jar);
}

export async function session(cookie) {
  const res = await fetch(`${BASE_URL}/api/auth/session`, { headers: { cookie } });
  return res.json();
}

// Requête API ; renvoie { status, body } (body = JSON si possible, sinon texte)
export async function api(cookie, method, path, data) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { ...(cookie ? { cookie } : {}), ...(data ? { "Content-Type": "application/json" } : {}) },
    body: data ? JSON.stringify(data) : undefined,
    redirect: "manual",
  });
  const text = await res.text();
  let body = text;
  try { body = JSON.parse(text); } catch { /* page HTML ou réponse vide */ }
  return { status: res.status, body };
}

export async function assertServerUp() {
  try {
    await fetch(`${BASE_URL}/api/auth/csrf`);
  } catch {
    throw new Error(`L'application ne répond pas sur ${BASE_URL}. Lancez d'abord « npm run dev ».`);
  }
}
