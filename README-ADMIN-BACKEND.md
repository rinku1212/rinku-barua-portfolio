# Portfolio Admin Backend — Phase 2 (Free-only)

This branch contains backend scaffolding for the portfolio. It does not change the production branch or the COLOUR CAT repository.

## Architecture

- Cloudflare Pages: public site and Pages Functions.
- Cloudflare D1: draft content, revisions, media metadata and login throttling.
- GitHub repository: media files stored under `media/admin/`.
- This implementation does not require R2.

## Preview setup — do not deploy to Production yet

In Cloudflare Pages settings, configure the Preview environment:

1. Add D1 binding `DB` pointing to `rinku-portfolio-db`.
2. Add encrypted secrets:
   - `ADMIN_PASSWORD`: unique strong password, at least 16 characters.
   - `SESSION_SECRET`: random secret at least 32 characters, different from the password.
   - `GITHUB_TOKEN`: fine-grained GitHub token restricted to only `rinku1212/rinku-barua-portfolio`, with **Contents: Read and write** permission only.
3. Add environment variables:
   - `GITHUB_OWNER` = `rinku1212`
   - `GITHUB_REPO` = `rinku-barua-portfolio`
   - `GITHUB_BRANCH` = `admin-backend-phase2`
4. Set the Pages Preview branch to `admin-backend-phase2`.
5. The D1 schema was already created manually using `migrations/0001_initial.sql`; do not run it again unless needed.

Never put secrets in HTML, JavaScript, Wrangler TOML or Git commits. Never share secret values in chat.

## API routes

- `GET /api/health` — configuration checks only.
- `POST /api/auth/login` — JSON body `{"password":"..."}`.
- `GET /api/auth/me` — session status.
- `POST /api/auth/logout` — clears session.
- `GET /api/content` and `PUT /api/content` — authenticated draft read/save.
- `GET /api/media` — authenticated media list.
- `POST /api/media` — authenticated multipart upload; form field `file`.

## Media limits and privacy

- JPG, PNG, WEBP and PDF only; maximum 8 MB per file.
- Each upload creates a commit in the configured GitHub branch and triggers a Pages build.
- The repository is public, so uploaded files are public. Do not upload private or sensitive documents.
- GitHub storage, API and Pages build limits apply. This is not unlimited storage or a guarantee of zero future service changes.
- Media deletion/replacement UI and public publishing are not implemented yet.

## Security status

This is initial scaffolding, not production-ready CMS software. Use Preview only until login, upload and content flows have been tested and reviewed. The GitHub token must be fine-grained and restricted to this repository. MFA and a full security review remain future work.

## Local requirements

No Docker, local database, Node build chain, React or Vite is required for this setup.
