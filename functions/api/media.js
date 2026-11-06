import { json, requireAdmin, sameOrigin } from "../_lib/auth.js";

const MAX_FILE_SIZE = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

function safeFileName(name) {
  return String(name || "upload")
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 100) || "upload";
}

function toBase64(bytes) {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function githubConfig(env) {
  return {
    token: env.GITHUB_TOKEN,
    owner: env.GITHUB_OWNER || "rinku1212",
    repo: env.GITHUB_REPO || "rinku-barua-portfolio",
    branch: env.GITHUB_BRANCH || "admin-backend-phase2"
  };
}

async function githubRequest(config, path, options = {}) {
  return fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/contents/${path}`, {
    ...options,
    headers: {
      "Accept": "application/vnd.github+json",
      "Authorization": `Bearer ${config.token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "Rinku-Portfolio-Admin",
      ...(options.headers || {})
    }
  });
}

export async function onRequestGet({ request, env }) {
  const denied = await requireAdmin(request, env);
  if (denied) return denied;
  const result = await env.DB.prepare(
    "SELECT id, object_key, original_name, content_type, size_bytes, is_public, created_at FROM media_assets ORDER BY created_at DESC LIMIT 200"
  ).all();
  const origin = new URL(request.url).origin;
  return json({
    ok: true,
    items: (result.results || []).map(item => ({
      ...item,
      url: item.is_public ? `${origin}/${item.object_key}` : null
    }))
  });
}

export async function onRequestPost({ request, env }) {
  if (!sameOrigin(request)) return json({ ok: false, error: "Invalid request origin." }, 403);
  const denied = await requireAdmin(request, env);
  if (denied) return denied;

  const config = githubConfig(env);
  if (!config.token) {
    return json({ ok: false, error: "GitHub media storage is not configured. Add the GITHUB_TOKEN secret first." }, 503);
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || typeof file.arrayBuffer !== "function") {
    return json({ ok: false, error: "Select a file to upload." }, 400);
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return json({ ok: false, error: "Allowed file types: JPG, PNG, WEBP and PDF." }, 415);
  }
  if (file.size < 1 || file.size > MAX_FILE_SIZE) {
    return json({ ok: false, error: "File size must be between 1 byte and 8 MB." }, 413);
  }

  const id = crypto.randomUUID();
  const name = safeFileName(file.name);
  const path = `media/admin/${id}-${name}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  let uploadResponse;
  try {
    uploadResponse = await githubRequest(config, path, {
      method: "PUT",
      body: JSON.stringify({
        message: `Add portfolio media: ${name}`,
        content: toBase64(bytes),
        branch: config.branch
      }),
      headers: { "Content-Type": "application/json" }
    });
  } catch {
    return json({ ok: false, error: "Could not connect to GitHub. Check the GitHub token and try again." }, 502);
  }

  if (!uploadResponse.ok) {
    const details = await uploadResponse.json().catch(() => ({}));
    const message = uploadResponse.status === 401 || uploadResponse.status === 403
      ? "GitHub rejected the token or repository permission. Check the fine-grained token's Contents: Read and write permission."
      : uploadResponse.status === 404
        ? "The repository or target branch was not found. Check GITHUB_OWNER, GITHUB_REPO and GITHUB_BRANCH."
        : details.message || "GitHub upload failed.";
    return json({ ok: false, error: message }, uploadResponse.status === 429 ? 429 : 502);
  }

  try {
    await env.DB.prepare(
      "INSERT INTO media_assets (id, object_key, original_name, content_type, size_bytes, is_public) VALUES (?, ?, ?, ?, ?, 1)"
    ).bind(id, path, name, file.type, file.size).run();
  } catch {
    return json({
      ok: false,
      error: "The file was committed to GitHub, but its media-library record could not be saved. Contact support before uploading it again.",
      path
    }, 500);
  }

  return json({
    ok: true,
    item: {
      id,
      objectKey: path,
      originalName: name,
      contentType: file.type,
      sizeBytes: file.size,
      visibility: "public",
      url: `/${path}`
    },
    note: "The file is committed to the configured GitHub branch. It will appear on the deployed site after Cloudflare Pages finishes its build."
  }, 201);
}
