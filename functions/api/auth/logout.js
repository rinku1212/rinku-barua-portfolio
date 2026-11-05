import { json, sameOrigin, clearSessionCookie } from "../../_lib/auth.js";

export async function onRequestPost({ request }) {
  if (!sameOrigin(request)) return json({ ok: false, error: "Invalid request origin." }, 403);
  return json(
    { ok: true },
    200,
    { "Set-Cookie": clearSessionCookie() }
  );
}
