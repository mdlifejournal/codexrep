# MedTerms

A beginner-friendly web app inspired by etymonline.com, focused on medical terminology.

## Stack
- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Static JSON data (`/data/terms.json`) with local file write support in development

## Getting Started

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Set the admin password

Create a `.env.local` file in the project root:

```bash
ADMIN_PASSWORD=your-secret-password
```

Restart the dev server after editing env vars.

## Add a term from the app

1. Open `/admin/add`.
2. Enter your admin password to unlock.
3. Keep mode as **Add new term**.
4. Fill out the term form (`term`, `definition`, `explanation`, and optional fields).
5. (Optional) In the **Explanation** box, paste an image from your clipboard. It uploads to `/public/uploads` and inserts markdown automatically.
6. Submit to call `POST /api/terms`.
7. The term is appended to `/data/terms.json` with generated `slug` + `createdAt` timestamp.

## Edit an existing term from the app

1. Open `/admin/add` and unlock with admin password.
2. In **Edit existing term**, select a term and click **Load**.
3. Update any fields you want.
4. Click **Update term** to save changes through `PUT /api/terms/[slug]`.

## Important note about JSON file saving

This project writes to `data/terms.json` using Node file I/O. That works well in local development.
On many hosting providers (serverless or immutable filesystems), writes may fail or not persist between deployments/restarts.
For production, use a real database or persistent storage.

## Troubleshooting: "Unauthorized" when saving

If the admin form shows `Error: Unauthorized`, check these:

1. `ADMIN_PASSWORD` is set in `.env.local`.
2. You restarted `npm run dev` after changing `.env.local`.
3. The password typed on `/admin/add` exactly matches `ADMIN_PASSWORD`.
