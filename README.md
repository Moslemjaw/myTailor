# MyTailor

A two-sided marketplace for custom clothing:
**Request → Offers → Selection → Order → Chat → Progress → Completion → Review.**

Next.js 16 (App Router) · Tailwind CSS 4 · Supabase (Postgres, Auth, Storage, Realtime) · OpenRouter (server-side only).

## Setup

1. `npm install`
2. `.env` needs:
   ```
   OPENROUTER_API_KEY=…            # server only
   OPENROUTER_MODEL=google/gemini-2.5-flash
   SUPABASE_URL=…
   SUPABASE_PUBLISHABLE_KEY=…
   NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$SUPABASE_PUBLISHABLE_KEY
   # optional in production: NEXT_PUBLIC_SITE_URL=https://your-domain
   ```
   The app never uses `SUPABASE_SECRET_KEY`.
3. Apply the database migration in `supabase/migrations/` (Supabase SQL editor, `supabase db push`, or the Supabase MCP).
4. Supabase Auth → URL configuration: add `http://localhost:3000/auth/callback` (and your production URL) to the redirect allow-list.
5. `npm run dev`

## Where things live

| Path | Purpose |
| --- | --- |
| `src/app/(marketing)` | Landing, How it works, For tailors, legal |
| `src/app/(auth)` | Role-first sign-up, sign-in, password reset |
| `src/app/(app)` | Signed-in product (role-specific shell + pages) |
| `src/actions` | Server actions — thin wrappers over RLS-protected queries/RPCs |
| `src/lib/queries.ts` | Read models; each screen asks only for what its user may see |
| `src/lib/ai.ts` | OpenRouter call (`server-only` — cannot be bundled for the browser) |
| `src/lib/brand-images.ts` | All editorial photography in one place — swap for brand shoots |
| `supabase/migrations` | Schema, RLS, grants, marketplace RPCs, storage policies |

## Security model

The UI shapes what people normally do; Postgres decides what they are allowed to do.

- **RLS on every table**, and Supabase's default table grants are revoked, then re-granted per column.
- **State changes go through `SECURITY DEFINER` functions** that validate the caller and lock rows:
  `submit_offer`, `decline_offer`, `accept_offer`, `advance_order`, `create_review`.
- **Blind bidding:** a tailor can select only their own offer and revisions. Competition is exposed only as a count (`request_offer_count`, `tailor_request_feed`).
- **Orders and chat:** readable and writable by the two participants only. `sender_id` is forced to `auth.uid()`.
- **Order state machine:** `accepted → in_progress → ready → completed`, tailor only, one step at a time.
- **Reviews:** customer of the order, status `completed`, once (unique + RPC check).
- **Measurements:** stored in `request_measurements`, readable only by the request owner and — after acceptance — the tailor on that order. Browsing tailors see only the size and a `has_measurements` flag. They are frozen once the request closes and validated in the database (known keys, 1–300 cm).
- **Role:** set once from sign-up metadata and never updatable.
- **AI key:** used only in `src/lib/ai.ts` (`import "server-only"`). Images are read with the customer's own session, so Storage RLS applies.

Verify the bundle yourself after `npm run build`:

```bash
grep -rl "$OPENROUTER_API_KEY" .next/static   # → no output
```
