import { json, requireAdmin, sameOrigin } from "../_lib/auth.js";

export async function onRequestGet({ request, env }) {
  const denied = await requireAdmin(request, env);
  if (denied) return denied;
  const row = await env.DB.prepare(
    "SELECT draft_json, updated_at FROM site_content WHERE id = 1"
  ).first();
  let content = {};
  try { content = row?.draft_json ? JSON.parse(row.draft_json) : {}; } catch {
    return json({ ok: false, error: "Stored draft is invalid JSON." }, 500);
  }
  return json({ ok: true, content, updatedAt: row?.updated_at || null });
}

export async function onRequestPut({ request, env }) {
  if (!sameOrigin(request)) return json({ ok: false, error: "Invalid request origin." }, 403);
  const denied = await requireAdmin(request, env);
  if (denied) return denied;

  const length = Number(request.headers.get("Content-Length") || 0);
  if (length > 1024 * 1024) return json({ ok: false, error: "Content is too large (1 MB maximum)." }, 413);

  let body;
  try { body = await request.json(); } catch {
    return json({ ok: false, error: "Invalid JSON body." }, 400);
  }
  if (!body || typeof body.content !== "object" || Array.isArray(body.content)) {
    return json({ ok: false, error: "A content object is required." }, 400);
  }

  const serialized = JSON.stringify(body.content);
  if (serialized.length > 1024 * 1024) {
    return json({ ok: false, error: "Content is too large (1 MB maximum)." }, 413);
  }

  await env.DB.batch([
    env.DB.prepare(
      "INSERT INTO content_revisions (content_json, revision_note) SELECT draft_json, 'Automatic snapshot before save' FROM site_content WHERE id = 1"
    ),
    env.DB.prepare(
      "UPDATE site_content SET draft_json = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1"
    ).bind(serialized)
  ]);

  return json({ ok: true, savedAt: new Date().toISOString() });
}
