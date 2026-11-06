import { json, requireAdmin, sameOrigin } from "../_lib/auth.js";

export async function onRequestGet({ request, env }) {
  const denied = await requireAdmin(request, env);
  if (denied) return denied;
  const result = await env.DB.prepare(
    "SELECT id, revision_note, created_at FROM content_revisions ORDER BY id DESC LIMIT 50"
  ).all();
  return json({ ok: true, items: result.results || [] });
}

export async function onRequestPost({ request, env }) {
  if (!sameOrigin(request)) return json({ ok: false, error: "Invalid request origin." }, 403);
  const denied = await requireAdmin(request, env);
  if (denied) return denied;

  let body;
  try { body = await request.json(); } catch {
    return json({ ok: false, error: "Invalid JSON body." }, 400);
  }
  const id = Number(body?.revisionId);
  if (!Number.isSafeInteger(id) || id < 1) {
    return json({ ok: false, error: "A valid revision ID is required." }, 400);
  }

  const revision = await env.DB.prepare(
    "SELECT content_json FROM content_revisions WHERE id = ?"
  ).bind(id).first();
  if (!revision) return json({ ok: false, error: "Revision not found." }, 404);

  let parsed;
  try { parsed = JSON.parse(revision.content_json); } catch {
    return json({ ok: false, error: "This revision contains invalid JSON." }, 500);
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return json({ ok: false, error: "This revision is not a valid content object." }, 500);
  }

  await env.DB.batch([
    env.DB.prepare(
      "INSERT INTO content_revisions (content_json, revision_note) SELECT draft_json, 'Snapshot before restore' FROM site_content WHERE id = 1"
    ),
    env.DB.prepare(
      "UPDATE site_content SET draft_json = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1"
    ).bind(JSON.stringify(parsed))
  ]);

  return json({ ok: true, restoredRevisionId: id });
}
