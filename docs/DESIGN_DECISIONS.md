# MyTailor — Schema, Access Control & Stretch Goal

**Live app:** https://mytailor-sigma.vercel.app · **Migrations:** [`supabase/migrations/`](../supabase/migrations)

## The one principle

> **The UI decides what people *normally* do. Postgres decides what they are *allowed* to do.**

Everything below follows from that. The browser is treated as hostile: anyone can open DevTools, copy their JWT, and call Supabase directly. So no rule is enforced only in React or in a Server Action.

## Schema

```
auth.users ─1:1─ profiles (role: customer | tailor, set once)
                   │
     customer ─────┼──< requests (status: open | closed)
                   │       │  └─1:1─ request_measurements   (private body data)
     tailor ───────┼──< offers  (one per tailor per request)
                   │       └──< offer_revisions             (append-only history)
                   │
                   └──< orders (one per request; status: accepted → in_progress → ready → completed)
                           ├──< order_events   (audit trail of every status change)
                           ├──< messages       (chat)
                           └──1 reviews        (unique per order)
                 notifications (per user; realtime)
```

| Decision | Why | What breaks without it |
|---|---|---|
| `role` on `profiles`, set by a trigger from sign-up metadata; **no UPDATE grant** on the column | Role is the root of every other rule | A customer flips to `tailor`, bids on their own request, accepts it |
| **One offer row per (request, tailor)** plus a separate `offer_revisions` table | "Revise any number of times, every revision logged". The row holds the current state, the table holds history, so queries stay simple and history is append-only | With only one table you either lose history or need "latest revision" logic in every query |
| `offers.revision` counter | Revision N in history always matches the offer at that moment | — |
| **Order copies `price` and `turnaround_days`** from the offer | The deal is a contract, frozen at acceptance | Changing the offer later would silently change the order |
| `orders.request_id UNIQUE` and `orders.offer_id UNIQUE` | One order per request, enforced by the database | Two concurrent accepts create two orders |
| `order_events` | Audit trail: who moved the order, and when | No way to answer "who marked this completed?" |
| `reviews.order_id UNIQUE` | "Only once" survives even a race | Double-click creates two reviews |
| `check (customer_id <> tailor_id)` on orders | Belt and braces against self-dealing | — |
| Measurements in **their own table** | They are personal body data with stricter visibility than the rest of the request | Every tailor browsing sees a stranger's body measurements |

**Derived values are computed, not stored**, so they can never go stale or be written by a client:
- *Bid count* (`request_offer_count`, `tailor_request_feed`) is counted on read.
- *Tailor rating* (`tailor_stats`) is `avg(rating)` and a count of completed orders, computed on read.
- *Bid editability* is derived from `request.status`, never stored on the bid (see "the trap").
- The one stored derived value, `requests.has_measurements`, is maintained **only by a trigger** and is never granted to clients.

## Access control, in three layers

**1. Grants: what may a client touch at all?**
Supabase grants `ALL` on new tables to `anon` and `authenticated` by default. I revoked everything and granted back per column. For example, customers may `INSERT requests (title, description, garment_type, desired_date, image_path, ai_assisted)`, but `status`, `customer_id` and `closed_at` are never writable. There are **no** client write grants on `offers`, `orders`, `reviews` or `order_events` at all.

**2. RLS: which rows can you see?**
Every table has RLS enabled. Examples:
- `offers`: `tailor_id = auth.uid() OR owns_request(request_id)`. This is blind bidding.
- `requests`: yours, or open (if you're a tailor), or ones you've bid on.
- `messages` / `orders`: participants only. `sender_id` defaults to `auth.uid()` and isn't insertable.

**3. `SECURITY DEFINER` functions: the only doors for multi-row state changes.**
`submit_offer`, `decline_offer`, `accept_offer`, `advance_order`, `create_review`. Each one reads the caller from `auth.uid()`, never from a parameter; locks the rows it touches (`SELECT … FOR UPDATE`); validates the state machine; and raises a stable error code (`REQUEST_CLOSED`, `INVALID_TRANSITION`, …) that the app maps to a friendly message.

*Why not RLS alone for accepting a bid?* Accepting is five writes that must succeed or fail together: accept one offer, close the others, close the request, create the order, log an event. RLS judges each row separately and cannot express "if you update this row you must also update those rows". A function in one transaction can.

### The trap: bid mutability depends on the request

The easy wrong design is an `editable` flag on each bid. That flag goes stale the instant another tailor's bid is accepted. Instead, `submit_offer()` locks the **parent request** and checks `request.status = 'open'`. `accept_offer()` locks the same row, so the two can never interleave: if a tailor submits a revision at the same moment the customer accepts, the revision waits, then sees `closed` and fails with `REQUEST_CLOSED`.

### Blind bidding's aggregate: why a count and not a price

I considered showing tailors the lowest or average bid. With exactly two bidders, "lowest bid" **is** your competitor's price, so it would leak the very thing blind bidding hides. A count gives a sense of competition and reveals nothing about any single bid.

## What I tried that didn't work

- **RLS helper functions were first created in `public`.** Supabase's security advisor flagged them: anything in `public` is callable over `/rest/v1/rpc`, so a user could probe `owns_request(<id>)` directly. The fix ([`20260923150000_harden_helpers.sql`](../supabase/migrations/20260923150000_harden_helpers.sql)) moved them to a `private` schema. Policies keep working because Postgres references functions by id, not by name.
- **Policies that query each other recurse.** `requests` RLS checks `offers` and `offers` RLS checks `requests`, so Postgres loops forever. Wrapping the checks in `SECURITY DEFINER` helpers breaks the cycle, and each helper only ever answers about the calling user.
- **Sign-up during testing hit Supabase's built-in email rate limit** and failed with an unhelpful raw error. I added mapping for those auth errors so users see a clear message instead.
- *(Add your own here. The panel values honest war stories most: anything that surprised you, broke in production, or that you had to redesign.)*

---

## Stretch goal: size & measurements, with privacy by design

**The feature.** When posting a request, a customer can add a standard size (XS–XXXL) and, optionally, garment-specific body measurements in cm, with a how-to-measure guide.

**Why this feature.** Bespoke tailoring is a measurement business. Without measurements a tailor's bid is a guess, so the first days of every order are spent in chat asking "what's your chest?". Knowing the size up front makes bids more accurate. Having measurements ready at acceptance means work can start immediately.

**Why it was interesting to build.** It is the same access-control problem as the rest of the app, but with **more sensitive data**:

| Who | Sees |
|---|---|
| Customer (owner) | Everything, and can edit it while the request is open |
| Tailors browsing an open request | Size + a `has_measurements` flag only, **never the numbers** |
| The tailor whose bid was accepted | The measurements, from the moment the order exists |
| Everyone else | Nothing |

- Measurements live in a separate `request_measurements` table with its own RLS. Column-level hiding on `requests` would have been fragile.
- They **freeze when the request closes**, just like bids. The write policies require `requests.status = 'open'`, so the tailor always works from what was agreed.
- The database validates them: only known keys (`chest`, `waist`, `inseam`, …) are allowed, and every value must be a number from 1 to 300 cm. Garbage from a forged request is rejected.
- The public `has_measurements` flag is kept in sync by a trigger that no client can call.

**Other features I'd build next (proposals):**
1. **Bid expiry / request deadline.** Requests auto-close after N days, so tailors don't bid into requests the customer abandoned. It uses the same "state lives on the request" pattern.
2. **Tailor portfolio images.** A public Storage bucket per tailor, shown on their profile and next to their bids, so customers compare work, not just price.
3. **Customer-confirmed completion.** The customer confirms before `completed`, which prevents a tailor from closing an order early to unlock a review window.
