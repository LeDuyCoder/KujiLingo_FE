# KujiLingo deployment setup

This repository contains the Next.js web app. The API and database are configured separately:

- Web: Vercel, project root `apps/web`
- API: Render Blueprint in the KujiLingo_BE repository (`render.yaml`)
- Database: Supabase PostgreSQL

## 1. Create the Supabase database

Create a Supabase project and open **Connect**. Configure the two Render secrets like this:

- `DATABASE_URL`: Shared **Transaction pooler**, port `6543`, with `?pgbouncer=true`.
- `DIRECT_URL`: Shared **Session pooler**, port `5432`; Prisma uses this URL for migrations.

Replace `[YOUR-PASSWORD]` with the database password. URL-encode special characters in the password. Both shared pooler endpoints support IPv4.

## 2. Create the Vercel project

Import the KujiLingo_FE repository and configure the Next.js project:

- Root Directory: `apps/web`
- Include source files outside the root directory: enabled, so Vercel can use the workspace lockfile at the repository root

Create an initial deployment and note the Vercel production URL. The app will not reach the API until you set `NEXT_PUBLIC_API_URL` in step 4.

## 3. Deploy the API on Render

Create a Blueprint from the KujiLingo_BE repository and select its `render.yaml`. Set the prompted values in Render's dashboard:

- `DATABASE_URL`: Supabase Transaction pooler string (port `6543`)
- `DIRECT_URL`: Supabase Session pooler string (port `5432`)
- `FRONTEND_URL`: the Vercel production URL, such as `https://kujilingo.vercel.app`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, `GOOGLE_REFRESH_TOKEN`
- `MAIL_FROM_EMAIL`, `MAIL_FROM_NAME`
- `JWT_PRIVATE_KEY`, `JWT_PUBLIC_KEY`: one matching RSA PEM key pair
- `PVP_INTERNAL_KEY`: a long random secret
- `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY`: PayOS credentials if payment checkout should be enabled

Generate a stable RSA pair locally with OpenSSL:

```sh
openssl genrsa -out jwt-private.pem 2048
openssl rsa -in jwt-private.pem -pubout -out jwt-public.pem
```

Store both PEM values in Render. To enter them as single-line secrets from PowerShell, Base64-encode each file with `[Convert]::ToBase64String([IO.File]::ReadAllBytes("jwt-private.pem"))` and the same command for `jwt-public.pem`. The app decodes Base64 PEM values at startup. Do not commit these keys or put them in this repository. The Render start command applies committed Prisma migrations before starting the API; add migrations to `prisma/migrations` before deploying schema changes.

After the first deploy, copy the API URL, for example `https://kujilingo-api.onrender.com`.

## 4. Connect the web app to the API

In Vercel, set `NEXT_PUBLIC_API_URL` to `https://<your-render-service>.onrender.com/api/v1` for Production and Preview as needed, then redeploy. `NEXT_PUBLIC_*` values are embedded during the build. Confirm Render's `FRONTEND_URL` is the Vercel production URL and redeploy the API if you changed it.

## Free-tier notes

Render Free sleeps after inactivity; the first API request after sleep may take about a minute. Supabase Free can pause after a week of low database activity. Vercel Hobby is for personal, non-commercial use. Keep production credentials in platform environment variables, not in `.env` files committed to Git.
