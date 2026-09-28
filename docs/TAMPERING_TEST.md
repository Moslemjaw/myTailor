# MyTailor — Tampering Test Write-up

**Live app:** https://mytailor-sigma.vercel.app · **Repo:** https://github.com/Moslemjaw/myTailor

## How I attacked it

I didn't click buttons that the UI hides. Instead, I called the database the way anyone with DevTools can. The browser already holds everything needed: the Supabase URL, the publishable key and the signed-in user's JWT. So every attack uses exactly those three things and talks to Supabase's REST/RPC API directly, **bypassing the Next.js app entirely**. If the database holds, the app holds.

The attacks are scripted so they can be re-run and are not one-off screenshots:

| Script | What it does |
|---|---|
| [`scripts/tampering-test.mjs`](../scripts/tampering-test.mjs) | Signs in as 3–4 real accounts, stages a real request → bids → order, runs attacks #1–#4 plus the "trap", and records every response in [`tampering-results.md`](tampering-results.md) |
| [`scripts/check-local-bundle.mjs`](../scripts/check-local-bundle.mjs) | Attack #5 over **every** browser file of a production build |
| [`scripts/check-bundle.mjs`](../scripts/check-bundle.mjs) | Attack #5 against the **deployed** site |

Every attack is paired with a **control**: the legitimate version of the same action, which must still succeed. A security rule that also blocks the real user is a bug, not a pass.

**Actors:** Customer **A** posts a request. Tailors **T1** and **T2** both bid on it. **A** accepts **T1**, so **T2** becomes the outsider.

---

## #1 — Accept your own bid as a tailor

**The attack.** T1 wants to make themselves the winner of A's request.

| Attempt (as T1) | Result |
|---|---|
| `rpc accept_offer(request, own offer)` | ❌ `REQUEST_NOT_FOUND` |
| `PATCH /offers?id=… {status:"accepted"}` | ❌ `42501 permission denied for table offers` |
| `PATCH /requests?id=… {status:"closed"}` | ❌ `42501 permission denied` |
| `POST /orders {…tailor_id: T1}` (forge the order) | ❌ `42501 permission denied for table orders` |
| *Control:* A's request still has 2 pending offers and no order | ✅ |

**Why it fails.** There are two layers.
1. **Grants:** no client may `UPDATE offers`, touch `requests.status` or `INSERT orders` at all. I revoked Supabase's default "ALL" grants and granted back only specific columns. Status fields are never granted.
2. **The only door is `accept_offer()`.** It locks the request row and checks `request.customer_id = auth.uid()`. The caller id comes from the verified JWT, not from a parameter. A tailor gets the same answer as for a request that doesn't exist, so the function reveals nothing. A second check (`offer.tailor_id <> auth.uid()`) blocks self-acceptance even in the odd case where a customer owned the request.

## #2 — Fetch another tailor's full bid

**The attack.** T2 is also bidding on the request and tries to read T1's price, turnaround and note.

| Attempt (as T2) | Result |
|---|---|
| `GET /offers?id=eq.<T1 offer id>` (id copied from anywhere) | 0 rows |
| `GET /offers?request_id=eq.<request>` | only T2's own row |
| `GET /offers?tailor_id=neq.<me>` (every competitor's price anywhere) | 0 rows |
| `GET /offer_revisions?offer_id=eq.<T1 offer id>` (T1's price history) | 0 rows |
| `rpc has_offer_on(...)` (probe the RLS helper functions) | ❌ function not found (not exposed) |
| *Control:* `rpc request_offer_count` → `2` (a number, no prices) | ✅ |
| *Control:* T1 reads their own 2 revisions (100 → 120) | ✅ |

**Why it fails.** The RLS policy on `offers` is `tailor_id = auth.uid() OR owns_request(request_id)`. Postgres adds that condition to every query, so T2's query becomes "…AND it's mine", and T1's row simply doesn't exist for T2. It is **not an error, just an empty result**, which leaks nothing (not even whether the id is real).

**The aggregate is deliberately a count and not a price.** I considered showing tailors the lowest or average bid. I rejected it because on a request with two bids, "lowest bid" *is* the other tailor's exact price, so the aggregate would reveal the very bid that blind bidding is supposed to hide. A count tells a tailor how much competition there is without revealing anything about it.

## The trap — bid mutability depends on the request, not the bid

A accepts T1. T2's bid was still `pending` a millisecond earlier.

| Attempt | Result |
|---|---|
| T2 revises their bid after the request closed | ❌ `REQUEST_CLOSED` |
| T1 (the winner) tries to raise the accepted price | ❌ `REQUEST_CLOSED` |
| A tries to accept a second bid | ❌ `REQUEST_CLOSED` |
| *Control:* T2's offer now shows `closed` | ✅ |

**Why.** `submit_offer()` doesn't trust any flag on the bid. It takes `SELECT … FOR UPDATE` on the **parent request** and rejects unless `request.status = 'open'`. Because `accept_offer()` locks the same row, a revision and an acceptance can never interleave. If a tailor submits a revision at the same moment the customer accepts a bid, one waits for the other, and the revision then sees `closed`.

## #3 — Open an order chat you're not part of

**The attack.** T2 lost, then changes the order id to A↔T1's order, both in the URL and in raw API calls.

| Attempt (as T2) | Result |
|---|---|
| Visit `/messages/<order id>` in the app | 404 page (the page's query returns nothing) |
| `GET /orders?id=eq.<order id>` | 0 rows |
| `GET /messages?order_id=eq.<order id>` | 0 rows |
| `POST /messages {order_id}` (write into their chat) | ❌ `42501 new row violates row-level security policy` |
| `POST /messages {sender_id: A}` (impersonate the customer) | ❌ `42501 permission denied` |
| Realtime: subscribe to `messages` for that order | 0 events *(control: T1 received them live)* |
| *Control:* T1 reads both messages | ✅ |

**Why.** `messages` policies call `is_order_participant(order_id)`, which only returns true if `auth.uid()` is that order's customer or tailor. Supabase Realtime applies the same RLS to change events, so the live channel leaks nothing either. `sender_id` is not an insertable column at all: it defaults to `auth.uid()`, so impersonating someone else is impossible.

## #4 — Review an order that isn't completed, or someone else's

| Attempt | Result |
|---|---|
| A reviews own order while status = `accepted` | ❌ `ORDER_NOT_COMPLETED` |
| A inserts into `reviews` directly (skipping the RPC) | ❌ `42501 permission denied` |
| T2 reviews an order they're not on | ❌ `ORDER_NOT_FOUND` |
| T1 reviews themselves | ❌ `ONLY_CUSTOMER_CAN_REVIEW` |
| A marks the order completed | ❌ `ONLY_TAILOR_CAN_UPDATE` |
| T1 jumps `accepted → completed` | ❌ `INVALID_TRANSITION` |
| T1 `PATCH /orders {status:"completed"}` | ❌ `42501 permission denied` |
| T1 goes backwards `completed → in_progress` | ❌ `INVALID_TRANSITION` |
| T2 / customer B reviews the completed order | ❌ `ORDER_NOT_FOUND` |
| A reviews a second time | ❌ `ALREADY_REVIEWED` |
| *Control:* T1 advances one step at a time to `completed`; A reviews once | ✅ |

**Why.** There is no insert grant on `reviews`, so the only way in is `create_review()`. It checks, in order: the caller is on the order, the caller is its customer, the status is `completed`, and no review exists yet. A `unique(order_id)` constraint backs up that last check even under a race. The status can only move through `advance_order()`, which computes the *single* legal next state from the current one, so skipping a step or going backwards is impossible.

## #5 — Search the client bundle for the AI API key

Ran on 2026-09-28:

```
$ npm run build && node --env-file=.env scripts/check-local-bundle.mjs
Scanned:      .next/static — 39 files, 1207 KB
Searched for: OPENROUTER_API_KEY value, SUPABASE_SECRET_KEY value, prefix "sk-or-",
              name "OPENROUTER_API_KEY", host "openrouter.ai"
Control:      publishable Supabase key found in 1 file(s) (expected — scanner works)
RESULT: PASS — no secret found in any browser file.

$ node --env-file=.env scripts/check-bundle.mjs https://mytailor-sigma.vercel.app
Pages crawled: 8 · JS files: 12 · Bytes scanned: 895 KB
RESULT: PASS — no match in any HTML page or JavaScript file.
```

The scan searches for the **actual key value**, not just its name. The control proves the method works: the publishable key, which is *meant* to be public, is found. The key does appear in `.next/server/…`, which is correct because that code runs only on Vercel's servers.

**Why.** `src/lib/ai.ts` starts with `import "server-only"`. If any client component ever imports it, **the build fails**, so this cannot regress silently. The browser calls a Server Action and never OpenRouter directly. The key has no `NEXT_PUBLIC_` prefix, so Next.js never inlines it into browser code. The Server Action also re-checks the session, the role (customer only) and that the image path belongs to the caller before spending AI credits.

---

## What this adds up to

The UI hides buttons for convenience, but **none of these results depend on the UI.** Every rule lives in Postgres as RLS, column grants and a small set of `SECURITY DEFINER` functions that read the caller's identity from the JWT. Next.js could be deleted and every attack above would still fail the same way.
