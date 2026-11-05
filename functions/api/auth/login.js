import { json, sameOrigin, createSession, sha256, constantTimeTextEqual } from "../../_lib/auth.js";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;
const BLOCK_MS = 15 * 60 * 1000;

export async function onRequestPost({ request, env }) {
  if (!sameOrigin(request)) return json({ ok: false, error: "Invalid request origin." }, 403);
  if (!env.DB || !env.ADMIN_PASSWORD || !env.SESSION_SECRET) {
    return json({ ok: false, error: "Server setup is incomplete. Configure D1 and required secrets first." }, 503);
  }

  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const bucket = await sha256(ip + ":" + new URL(request.url).hostname);
  const now = Date.now();

  const row = await env.DB.prepare(
    "SELECT attempts, window_started_at, blocked_until FROM login_attempts WHERE bucket_id = ?"
  ).bind(bucket).first();

  if (row && row.blocked_until > now) {
    return json({ ok: false, error: "Too many attempts. Try again after 15 minutes." }, 429);
  }

  let attempts = row && now - row.window_started_at < WINDOW_MS ? row.attempts : 0;
  let windowStarted = attempts ? row.window_started_at : now;

  let body;
  try { body = await request.json(); } catch {
    return json({ ok: false, error: "Invalid request body." }, 400);
  }

  const password = typeof body.password === "string" ? body.password : "";
  const matches = password.length > 0 && await constantTimeTextEqual(password, env.ADMIN_PASSWORD);

  if (!matches) {
    attempts += 1;
    const blockedUntil = attempts >= MAX_ATTEMPTS ? now + BLOCK_MS : 0;
    await env.DB.prepare(
      `INSERT INTO login_attempts (bucket_id, attempts, window_started_at, blocked_until)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(bucket_id) DO UPDATE SET
         attempts = excluded.attempts,
         window_started_at = excluded.window_started_at,
         blocked_until = excluded.blocked_until`
    ).bind(bucket, attempts, windowStarted, blockedUntil).run();
    return json({ ok: false, error: "Incorrect password." }, attempts >= MAX_ATTEMPTS ? 429 : 401);
  }

  await env.DB.prepare("DELETE FROM login_attempts WHERE bucket_id = ?").bind(bucket).run();
  const session = await createSession(env.SESSION_SECRET);
  return json(
    { ok: true, message: "Authenticated." },
    200,
    { "Set-Cookie": session.cookie }
  );
}
