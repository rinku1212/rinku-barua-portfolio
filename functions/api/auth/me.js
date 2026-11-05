import { json, verifySession } from "../../_lib/auth.js";

export async function onRequestGet({ request, env }) {
  const authenticated = await verifySession(request, env.SESSION_SECRET);
  return json({ ok: true, authenticated });
}
