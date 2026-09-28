# Presentation plan (20–25 min)

## Before the session
- [ ] Run `node --env-file=.env --env-file=.env.tampering scripts/tampering-test.mjs` the day before. Keep `docs/tampering-results.md` open.
- [ ] Two browser windows: customer A (normal) and tailor T2 (incognito), both signed in on https://mytailor-sigma.vercel.app
- [ ] A terminal ready for the bundle scan, and the Supabase dashboard open on **Authentication → Policies**.

## 1. Demo — 5 min (the evidence is what counts)

| Min | Show |
|---|---|
| 0:00 | One sentence: "Every rule lives in Postgres; I attacked the database directly, not the UI." |
| 0:30 | Run `tampering-test.mjs` live, or scroll the recorded run. Point at the *controls*: blocking must not break the real user. |
| 2:30 | #3 visually: as T2, paste A↔T1's order id into `/messages/<id>` → 404. |
| 3:30 | #5 live: `node --env-file=.env scripts/check-local-bundle.mjs`. Point at the positive control line. |
| 4:30 | The trap: T2's pending bid → `REQUEST_CLOSED` after acceptance. |

## 2. Walkthrough — 8 min
Use `docs/DESIGN_DECISIONS.md`. For each item, cover *why it exists → what breaks without it → what I tried that didn't work*.
1. Three layers: grants → RLS → definer functions (2 min)
2. Offers + revisions and blind bidding; why a count, not the lowest price (2 min)
3. `accept_offer` as one transaction; locking the request and the trap (2 min)
4. War stories: helpers in `public` flagged by the advisor; recursive policies (2 min)

## 3. Teach-back — 5 min: "Why can't we just hide the button?" (RLS)

Start from the problem, not the vocabulary.

1. **The problem (1 min).** Show the tailor's offer page. "The page only shows your own bid, so the other bids are hidden, right?" Open DevTools and copy the request to Supabase, then remove the filter. *Ask the room: what do you think comes back?*
   (On a table without RLS: every tailor's bids.) "The page was hiding them; the database wasn't."
2. **The analogy (1 min).** The UI is a receptionist who only *tells* you about your own files. RLS is a locked filing cabinet that physically only opens to your files, no matter who's asking or how.
3. **The idea (1.5 min).** A policy is a `WHERE` clause Postgres staples onto *every* query, whoever sends it:
   `using (tailor_id = auth.uid())`. Say `auth.uid()` in plain words: "the logged-in user, taken from their signed token, which they can't fake."
4. **Check understanding (1 min).** Ask the room:
   - "If T2 asks for T1's bid by its exact id, do they get an error or an empty list? Why is empty *better*?"
   - "I enable RLS but write no policies. What can users see?" (Nothing, because RLS denies by default.)
5. **Wrap-up (30 s).** "Rules in the UI are suggestions. Rules in the database are laws."

## 4. Q&A: likely questions
- *"Isn't the publishable key in the bundle a leak?"* No. It is designed to be public; it identifies the project, and RLS is what protects the data. The secret key never leaves the server (and the app doesn't use it at all).
- *"Why SQL migrations if the brief says 'not raw SQL'?"* My reading is that the brief wants a *designed* schema with RLS, not an app that runs ad-hoc SQL. Migrations are the reproducible way to ship tables and policies. Clarify with the panel if they meant otherwise.
- *"Why not do the checks in the Server Action?"* Anyone can skip the Server Action and call Supabase directly with their JWT. Tampering attack #1 shows exactly that.
- *"What if two customers' accepts race?"* `FOR UPDATE` on the request serialises them, and `orders.request_id UNIQUE` backs it up.
- *"Couldn't `SECURITY DEFINER` be dangerous?"* Yes. It bypasses RLS, so every function pins `search_path = ''`, reads identity only from `auth.uid()`, and validates everything itself. Helper functions are kept out of the exposed API schema.
- When you don't know: "I don't know. Here's how I'd find out: I'd reproduce it with the tampering script / check the Supabase docs."
