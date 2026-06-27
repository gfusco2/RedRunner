# Personal Running Log (RedRunner)

A personal training log built with Next.js (App Router), Tailwind CSS, and Prisma ORM, backed by a Supabase-hosted PostgreSQL database.

Data access is **Prisma-only**: the app connects directly to Postgres via `DATABASE_URL`. There is no `supabase-js` client. (If you later need Supabase Auth, Storage, or Realtime, add `@supabase/supabase-js` and the corresponding keys then.)

## Environment variables

The app needs exactly **one** environment variable: `DATABASE_URL`. Copy the template and fill in your connection string:

```bash
cp .env.example .env
```

### `DATABASE_URL`

**Where:** Supabase Dashboard → **Connect** button (top bar) → **Connection string**, or **Project Settings → Database → Connection string**.

Use the **session-mode pooler** string (port `5432`) and replace `[YOUR-PASSWORD]` with your database password (Project Settings → Database → Database password; reset there if needed):

```env
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
```

> **Prisma version note:** This project runs Prisma 3.x, which does **not** support the
> `directUrl` datasource field. So we use a **single** `DATABASE_URL` on the session-mode
> pooler (port `5432`) rather than the transaction-pooler + `directUrl` split that Supabase
> suggests for Prisma 4.10+. Session mode works for both `prisma db push` and runtime queries.
> If you upgrade Prisma to 4.10+, you can switch to the two-URL setup (transaction pooler on
> `6543` with `?pgbouncer=true` for `DATABASE_URL`, plus `DIRECT_URL` on `5432`).

Do not commit `.env` to git (it is already gitignored). `.env.example` is safe to commit.

## Setup

```bash
npm install
npx prisma db push    # create tables in Supabase Postgres
npx prisma generate   # generate the Prisma client (also runs on postinstall)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Data layer

### Prisma models

- **Activity** — `id`, `date`, `type` (`RUN` | `BIKE` | `XTRAIN`), `distance_miles`, `duration_seconds`, `notes`, optional `shoeId`
- **Shoe** — `id`, `brand`, `model`, `total_miles`, `active`

### Server Actions

Defined in `src/app/actions/activities.ts`:

| Action | Purpose |
|--------|---------|
| `createActivity` | Log a run, bike, or x-train session |
| `deleteActivity` | Remove an activity |
| `getActivitiesForWeek` | Fetch activities for a Monday-start week |
| `getCurrentWeekActivities` | Fetch activities for the current week |

### Pages

| Route | Purpose |
|-------|---------|
| `/dashboard` | Current week summary and totals |
| `/training-log` | Monday-start calendar; click a day to add activities |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Next.js dev server |
| `npm run build` | Production build |
| `npm run db:push` | Push schema changes to Supabase |
| `npm run db:studio` | Open Prisma Studio |
