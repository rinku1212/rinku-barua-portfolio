# Portfolio Admin Backend — Phase 2

This branch adds the first Cloudflare Pages Functions backend foundation for the portfolio. It does not change the public website files or the COLOUR CAT repository.

## Included

- Single-admin password login (no editor or second-admin accounts)
- Signed, eight-hour HttpOnly + Secure + SameSite=Strict session cookie
- Same-origin checks for state-changing requests
- D1-backed login throttling (eight failed attempts per 15-minute window)
- D1 draft-content storage and automatic pre-save revision snapshots
- Private R2 upload and media-library metadata for JPG, PNG, WEBP and PDF (10 MB maximum)
- Health endpoint for checking Cloudflare bindings and secrets

## Important deployment status

This is backend scaffolding only. It is intentionally on branch `admin-backend-phase2`, not the production branch. The public portfolio is not yet connected to D1 content and there is no Admin UI login page wired to these endpoints. Do not merge or deploy until the Cloudflare resources and secrets are configured and the frontend integration is tested.

## Cloudflare resources to create

1. Create a D1 database named `rinku-portfolio-db`.
2. Create a private R2 bucket named `rinku-portfolio-media`.
3. Copy the D1 database ID into `wrangler.toml`, replacing `REPLACE_WITH_D1_DATABASE_ID`.
4. In Cloudflare Pages project settings, add D1 binding `DB` and R2 binding `MEDIA` for both Preview and Production environments, pointing to the resources above.
5. Add these encrypted secrets to the Pages project for Preview first:
   - `ADMIN_PASSWORD`: a unique, strong password (at least 16 characters).
   - `SESSION_SECRET`: a random secret with at least 32 characters. Generate one with a password manager; do not reuse your admin password.
6. Apply migration `migrations/0001_initial.sql` to the D1 database.
7. After configuring Preview, test `/api/health`. It should return all four checks as true.

## API routes

- `GET /api/health` — configuration check; does not reveal secret values.
- `POST /api/auth/login` — JSON body: `{"password":"..."}`.
- `GET /api/auth/me` — reports whether the current session is authenticated.
- `POST /api/auth/logout` — clears the admin cookie.
- `GET /api/content` — authenticated draft retrieval.
- `PUT /api/content` — authenticated draft save; JSON body: `{"content":{...}}`.
- `GET /api/media` — authenticated media metadata list.
- `POST /api/media` — authenticated multipart upload using field name `file`.

## Security and limitations

- No password, session secret, or uploaded file is stored in the Git repository.
- Uploaded R2 objects are private by default. This phase does not expose public file URLs.
- The current upload endpoint accepts JPG, PNG, WEBP and PDF only, up to 10 MB per file.
- Content save creates a revision snapshot before replacing the draft. A full revision browser/restore UI is not included yet.
- No public publishing endpoint exists yet. Drafts cannot be published from this backend.
- Add MFA and a dedicated security review before treating this as a production CMS.
- Configure bindings/secrets separately for Preview and Production. Never put secrets in JavaScript or HTML.

## Local machine requirements

No Docker, local database, Node build chain, React or Vite is required for this Pages Functions deployment workflow. Cloudflare runs the backend. The user's Windows PC only needs a browser and a text editor for the manual setup steps.
