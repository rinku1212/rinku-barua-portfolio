import { json, requireAdmin, sameOrigin } from "../_lib/auth.js";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

export async function onRequestGet({ request, env }) {
  const denied = await requireAdmin(request, env);
  if (denied) return denied;
  const result = await env.DB.prepare(
    "SELECT id, object_key, original_name, content_type, size_bytes, is_public, created_at FROM media_assets ORDER BY created_at DESC LIMIT 200"
  ).all();
  return json({ ok: true, items: result.results || [] });
}

export async function onRequestPost({ request, env }) {
  if (!sameOrigin(request)) return json({ ok: false, error: "Invalid request origin." }, 403);
  const denied = await requireAdmin(request, env);
  if (denied) return denied;
  if (!env.MEDIA) return json({ ok: false, error: "R2 media storage is not configured." }, 503);

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || typeof file.arrayBuffer !== "function") {
    return json({ ok: false, error: "Select a file to upload." }, 400);
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return json({ ok: false, error: "Allowed file types: JPG, PNG, WEBP and PDF." }, 415);
  }
  if (file.size < 1 || file.size > MAX_FILE_SIZE) {
    return json({ ok: false, error: "File size must be between 1 byte and 10 MB." }, 413);
  }

  const id = crypto.randomUUID();
  const safeName = String(file.name || "upload").replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100);
  const objectKey = `admin-uploads/${id}/${safeName}`;
  await env.MEDIA.put(objectKey, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type },
    customMetadata: { originalName: safeName, assetId: id }
  });

  try {
    await env.DB.prepare(
      "INSERT INTO media_assets (id, object_key, original_name, content_type, size_bytes, is_public) VALUES (?, ?, ?, ?, ?, 0)"
    ).bind(id, objectKey, safeName, file.type, file.size).run();
  } catch (error) {
    await env.MEDIA.delete(objectKey);
    throw error;
  }

  return json({
    ok: true,
    item: { id, objectKey, originalName: safeName, contentType: file.type, sizeBytes: file.size, visibility: "private" }
  }, 201);
}
