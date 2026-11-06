import { json, requireAdmin, sameOrigin } from "../../_lib/auth.js";

export async function onRequestPost({ request, env }) {
  if (!sameOrigin(request)) return json({ ok: false, error: "Invalid request origin." }, 403);
  const denied = await requireAdmin(request, env);
  if (denied) return denied;

  let body;
  try { body = await request.json(); } catch {
    return json({ ok: false, error: "Invalid JSON body." }, 400);
  }
  if (body?.confirm !== true) {
    return json({ ok: false, error: "Explicit publish confirmation is required." }, 400);
  }

  const row = await env.DB.prepare(
    "SELECT draft_json, published_json FROM site_content WHERE id = 1"
  ).first();
  if (!row) return json({ ok: false, error: "Portfolio content record is missing." }, 500);

  const now = new Date().toISOString();
  await env.DB.batch([
    env.DB.prepare(
      "INSERT INTO content_revisions (content_json, revision_note) VALUES (?, ?)"
    ).bind(row.published_json || "{}", "Snapshot before publish"),
    env.DB.prepare(
      "UPDATE site_content SET published_json = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1"
    ).bind(row.draft_json || "{}")
  ]);

  return json({ ok: true, publishedAt: now });
}
