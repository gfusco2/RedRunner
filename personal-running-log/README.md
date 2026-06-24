# Personal Running Log (RedRunner)

A personal running log built with Next.js (App Router), Tailwind CSS, Prisma ORM, and Supabase PostgreSQL.

## Environment variables

Create a `.env` file in the project root. Prisma talks to Postgres directly; the Supabase JS keys are for future client-side features (auth, storage, etc.).

### 1. `DATABASE_URL` (required for Prisma)

**Where:** Supabase Dashboard → **Project Settings** → **Database** → **Connection string**

1. Open your project in [Supabase](https://supabase.com/dashboard).
2. Go to **Project Settings** (gear icon) → **Database**.
3. Under **Connection string**, choose **URI**.
4. Copy the connection string and replace `[YOUR-PASSWORD]` with your database password (the one you set when the project was created). Reset it on the same page if needed.

Use the **Direct connection** string (port `5432`) for local development and Prisma migrations:

```env
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
```

Or the classic host format:

```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
```

### 2. `SUPABASE_URL` (required for Supabase client)

**Where:** Supabase Dashboard → **Project Settings** → **API** → **Project URL**

```env
SUPABASE_URL="https://[PROJECT-REF].supabase.co"
```

### 3. `SUPABASE_ANON_KEY` (required for Supabase client)

**Where:** Supabase Dashboard → **Project Settings** → **API** → **Project API keys** → **anon** / **public**

```env
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Example `.env`

```env
DATABASE_URL="postgresql://postgres:your-password@db.your-project-ref.supabase.co:5432/postgres"
SUPABASE_URL="https://your-project-ref.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
```

Do not commit `.env` to git.

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

- **Run** — `id`, `date`, `distance_miles`, `duration_seconds`, `notes`, optional `shoeId`
- **Shoe** — `id`, `brand`, `model`, `total_miles`, `active`
- A run can optionally reference one shoe; deleting a shoe clears the link (`onDelete: SetNull`).

### Server Actions

Defined in `src/app/actions/runs.ts`:

| Action       | Purpose |
|--------------|---------|
| `createRun`  | Insert a run; optionally links a shoe and increments that shoe's `total_miles` |
| `getRuns`    | Fetch all runs, newest first, with shoe details included |

**Example — fetch runs in a Server Component:**

```tsx
import { getRuns } from "app/actions/runs";

export default async function RunsPage() {
  const runs = await getRuns();
  // ...
}
```

**Example — create a run:**

```tsx
import { createRun } from "app/actions/runs";

await createRun({
  date: "2026-06-23T07:30:00.000Z",
  distance_miles: 5.2,
  duration_seconds: 2580,
  notes: "Easy morning jog",
  shoeId: 1, // optional
});
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Next.js dev server |
| `npm run build` | Production build |
| `npm run db:push` | Push schema changes to Supabase |
| `npm run db:studio` | Open Prisma Studio |
