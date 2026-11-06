import { json } from "../_lib/auth.js";

export async function onRequestGet({ env }) {
  const checks = {
    database: Boolean(env.DB),
    adminPassword: Boolean(env.ADMIN_PASSWORD),
    sessionSecret: Boolean(env.SESSION_SECRET),
    githubMediaToken: Boolean(env.GITHUB_TOKEN),
    githubRepository: Boolean(env.GITHUB_OWNER || "rinku1212") && Boolean(env.GITHUB_REPO || "rinku-barua-portfolio"),
    githubBranch: Boolean(env.GITHUB_BRANCH || "admin-backend-phase2")
  };
  const ready = Object.values(checks).every(Boolean);
  return json({ ok: ready, checks }, ready ? 200 : 503);
}
