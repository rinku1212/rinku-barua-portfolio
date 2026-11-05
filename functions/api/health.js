import { json } from "../_lib/auth.js";

export async function onRequestGet({ env }) {
  const checks = {
    database: Boolean(env.DB),
    mediaStorage: Boolean(env.MEDIA),
    adminPassword: Boolean(env.ADMIN_PASSWORD),
    sessionSecret: Boolean(env.SESSION_SECRET)
  };
  const ready = Object.values(checks).every(Boolean);
  return json({ ok: ready, checks }, ready ? 200 : 503);
}
