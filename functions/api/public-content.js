import { json } from "../_lib/auth.js";

export async function onRequestGet({ env }) {
  const row = await env.DB.prepare(
    "SELECT published_json, updated_at FROM site_content WHERE id = 1"
  ).first();

  let content = {};
  try {
    content = row?.published_json ? JSON.parse(row.published_json) : {};
  } catch {
    return json({ ok: false, error: "Published content is invalid." }, 500);
  }

  return json({
    ok: true,
    content,
    updatedAt: row?.updated_at || null
  }, 200, { "Cache-Control": "public, max-age=60, s-maxage=60" });
}
