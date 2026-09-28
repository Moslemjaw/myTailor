// Tampering Test #1–#4 — run real attacks against the live Supabase project
// with real user sessions, exactly as a malicious user with DevTools could.
//
// Every call below uses only the PUBLISHABLE key + a signed-in user's JWT,
// i.e. the same power a browser has. No secret key is used.
//
// Setup (once): create these accounts on the live site and confirm their emails
//   customer "A"   tailor "T1"   tailor "T2"   (optional) customer "B"
// then put the credentials in .env.tampering (gitignored by `.env*`):
//   TEST_CUSTOMER_EMAIL=…   TEST_CUSTOMER_PASSWORD=…
//   TEST_TAILOR1_EMAIL=…    TEST_TAILOR1_PASSWORD=…
//   TEST_TAILOR2_EMAIL=…    TEST_TAILOR2_PASSWORD=…
//   TEST_CUSTOMER2_EMAIL=…  TEST_CUSTOMER2_PASSWORD=…   (optional)
//
// Run:  node --env-file=.env --env-file=.env.tampering scripts/tampering-test.mjs
// Output: console + docs/tampering-results.md
//
// Each run creates one clearly-labelled request, two offers, one order,
// two chat messages and one review in the database.

import { createClient } from "@supabase/supabase-js";
import { mkdirSync, writeFileSync } from "node:fs";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!URL || !KEY) throw new Error("NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY missing");

async function signIn(label, prefix, optional = false) {
  const email = process.env[`${prefix}_EMAIL`];
  const password = process.env[`${prefix}_PASSWORD`];
  if (!email || !password) {
    if (optional) return null;
    throw new Error(`${prefix}_EMAIL / ${prefix}_PASSWORD missing`);
  }
  const client = createClient(URL, KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`${label}: sign-in failed — ${error.message}`);
  const { data: profile } = await client.from("profiles").select("role").eq("id", data.user.id).single();
  client.realtime.setAuth(data.session.access_token);
  return { label, client, id: data.user.id, role: profile?.role };
}

// ---------------------------------------------------------------------------
// Reporting
// ---------------------------------------------------------------------------
const results = [];
let section = "";
const sections = [];

function heading(title, goal) {
  section = title;
  sections.push({ title, goal });
  console.log(`\n=== ${title}\n    ${goal}`);
}

function describe(res) {
  if (res?.error) return `error ${res.error.code ?? ""} “${res.error.message}”`.replace("error  ", "error ");
  if (Array.isArray(res?.data)) return `${res.data.length} row(s) returned`;
  if (res?.data === null || res?.data === undefined) return "no data";
  return `ok → ${JSON.stringify(res.data).slice(0, 80)}`;
}

function record({ who, attempt, expected, res, pass, kind = "attack" }) {
  const actual = describe(res);
  results.push({ section, who, attempt, expected, actual, pass, kind });
  console.log(`${pass ? "PASS" : "FAIL"} [${who}] ${attempt}\n       expected: ${expected}\n       actual:   ${actual}`);
}

function blocked(who, attempt, res, codeOrRe) {
  const msg = res.error ? `${res.error.code} ${res.error.message}` : "";
  const pass = Boolean(res.error) && (codeOrRe instanceof RegExp ? codeOrRe.test(msg) : msg.includes(codeOrRe));
  record({ who, attempt, expected: `rejected (${codeOrRe instanceof RegExp ? codeOrRe.source : codeOrRe})`, res, pass });
}

function emptyRows(who, attempt, res) {
  record({ who, attempt, expected: "0 rows (RLS hides it)", res, pass: !res.error && res.data?.length === 0 });
}

function control(who, attempt, expected, res, pass) {
  record({ who, attempt, expected, res, pass, kind: "control" });
}

function must(res, what) {
  if (res.error) throw new Error(`Setup step failed (${what}): ${res.error.message}`);
  return res.data;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// Actors
// ---------------------------------------------------------------------------
const A = await signIn("Customer A", "TEST_CUSTOMER");
const T1 = await signIn("Tailor T1", "TEST_TAILOR1");
const T2 = await signIn("Tailor T2", "TEST_TAILOR2");
const B = await signIn("Customer B", "TEST_CUSTOMER2", true);

const wrongRoles = [[A, "customer"], [T1, "tailor"], [T2, "tailor"], ...(B ? [[B, "customer"]] : [])]
  .filter(([u, role]) => u.role !== role);
if (wrongRoles.length) throw new Error(`Wrong account roles: ${wrongRoles.map(([u, r]) => `${u.label} should be ${r}`).join(", ")}`);

const startedAt = new Date();
console.log(`Target: ${URL}\nActors: ${[A, T1, T2, B].filter(Boolean).map((u) => `${u.label} (${u.role})`).join(", ")}`);

// ---------------------------------------------------------------------------
// Setup: A posts a request; T1 and T2 both bid; T1 revises once
// ---------------------------------------------------------------------------
const desired = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);
const request = must(
  await A.client.from("requests").insert({
    title: `[Tampering test] Navy suit ${startedAt.toISOString().slice(0, 16)}`,
    description: "Automated tampering test request — safe to ignore.",
    garment_type: "suit",
    desired_date: desired,
  }).select("id").single(),
  "create request",
);
const offer1 = must(await T1.client.rpc("submit_offer", { p_request_id: request.id, p_price: 100, p_turnaround_days: 14, p_message: "T1 first bid" }), "T1 bid");
const offer2 = must(await T2.client.rpc("submit_offer", { p_request_id: request.id, p_price: 90, p_turnaround_days: 10, p_message: "T2 secret bid" }), "T2 bid");
must(await T1.client.rpc("submit_offer", { p_request_id: request.id, p_price: 120, p_turnaround_days: 12, p_message: "T1 revised bid" }), "T1 revise");
console.log(`\nSetup: request ${request.id}, T1 offer ${offer1.id}, T2 offer ${offer2.id}`);

// ---------------------------------------------------------------------------
// #1 — Accept your own bid as a tailor
// ---------------------------------------------------------------------------
heading("#1 Accept your own bid as a tailor", "T1 tries to make themselves the winner of A's request.");

blocked(T1.label, "rpc accept_offer(request, own offer)",
  await T1.client.rpc("accept_offer", { p_request_id: request.id, p_offer_id: offer1.id }), "REQUEST_NOT_FOUND");
blocked(T1.label, "PATCH offers SET status='accepted' on own offer",
  await T1.client.from("offers").update({ status: "accepted" }).eq("id", offer1.id).select(), "42501");
blocked(T1.label, "PATCH requests SET status='closed' on A's request",
  await T1.client.from("requests").update({ status: "closed" }).eq("id", request.id).select(), "42501");
blocked(T1.label, "POST orders (forge an order for themselves)",
  await T1.client.from("orders").insert({ request_id: request.id, offer_id: offer1.id, customer_id: A.id, tailor_id: T1.id, price: 1, turnaround_days: 1 }).select(),
  "42501");
{
  const res = await A.client.from("offers").select("id,status").eq("request_id", request.id);
  control(A.label, "afterwards: both offers still pending, no order exists", "2 pending offers",
    res, res.data?.length === 2 && res.data.every((o) => o.status === "pending"));
}

// ---------------------------------------------------------------------------
// #2 — Fetch another tailor's full bid
// ---------------------------------------------------------------------------
heading("#2 Fetch another tailor's bid", "T2 is also bidding on the request and tries to read T1's price, timing and note.");

emptyRows(T2.label, "GET offers?id=eq.<T1's offer id>",
  await T2.client.from("offers").select("*").eq("id", offer1.id));
{
  const res = await T2.client.from("offers").select("*").eq("request_id", request.id);
  record({ who: T2.label, attempt: "GET offers?request_id=eq.<request> (list every bid)", expected: "only T2's own offer",
    res, pass: !res.error && res.data.length === 1 && res.data[0].tailor_id === T2.id });
}
emptyRows(T2.label, "GET offer_revisions?offer_id=eq.<T1's offer id> (T1's price history)",
  await T2.client.from("offer_revisions").select("*").eq("offer_id", offer1.id));
{
  const res = await T2.client.from("offers").select("price").neq("tailor_id", T2.id);
  record({ who: T2.label, attempt: "GET offers?tailor_id=neq.<me> (every competitor's price anywhere)", expected: "0 rows",
    res, pass: !res.error && res.data.length === 0 });
}
blocked(T2.label, "rpc owns_request / has_offer_on helper (probe RLS helpers)",
  await T2.client.rpc("has_offer_on", { p_request_id: request.id }), /PGRST202|not find|42501|42883/);
{
  const res = await T2.client.rpc("request_offer_count", { p_request_id: request.id });
  control(T2.label, "rpc request_offer_count — the only competitive signal", "a number (2), no prices", res, res.data === 2);
}
{
  const res = await T1.client.from("offer_revisions").select("revision,price").eq("offer_id", offer1.id).order("revision");
  control(T1.label, "T1 reads own revision log", "2 revisions (100 → 120)", res, res.data?.length === 2);
}

// ---------------------------------------------------------------------------
// Legit acceptance, then the "trap": bids freeze when the request closes
// ---------------------------------------------------------------------------
heading("Trap: bid mutability depends on the request", "A accepts T1's bid. T2's still-'pending' bid must become uneditable instantly.");

const orderId = must(await A.client.rpc("accept_offer", { p_request_id: request.id, p_offer_id: offer1.id }), "A accepts T1");
control(A.label, "rpc accept_offer(request, T1's offer)", "order id returned", { data: orderId }, Boolean(orderId));
blocked(T2.label, "rpc submit_offer — revise bid after the request closed",
  await T2.client.rpc("submit_offer", { p_request_id: request.id, p_price: 50, p_turnaround_days: 5, p_message: "late" }), "REQUEST_CLOSED");
blocked(T1.label, "rpc submit_offer — winner tries to change the accepted price",
  await T1.client.rpc("submit_offer", { p_request_id: request.id, p_price: 999, p_turnaround_days: 5, p_message: "more" }), "REQUEST_CLOSED");
blocked(A.label, "rpc accept_offer — accept a second bid on the closed request",
  await A.client.rpc("accept_offer", { p_request_id: request.id, p_offer_id: offer2.id }), "REQUEST_CLOSED");
{
  const res = await T2.client.from("offers").select("status").eq("id", offer2.id).single();
  control(T2.label, "T2's own offer status", "closed", res, res.data?.status === "closed");
}

// ---------------------------------------------------------------------------
// #3 — Open an order chat you're not part of
// ---------------------------------------------------------------------------
heading("#3 Open an order chat you're not part of", "T2 (the losing tailor) changes the order id to A↔T1's order.");

// Realtime listeners: T1 (participant, control) and T2 (attacker)
const heard = { T1: 0, T2: 0 };
const subscribed = { T1: false, T2: false };
const channels = [[T1, "T1"], [T2, "T2"]].map(([u, k]) =>
  u.client.channel(`tamper-${k}-${orderId}`)
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `order_id=eq.${orderId}` }, () => heard[k]++)
    .subscribe((s) => { if (s === "SUBSCRIBED") subscribed[k] = true; }),
);
for (let i = 0; i < 20 && !(subscribed.T1 && subscribed.T2); i++) await sleep(250);

must(await A.client.from("messages").insert({ order_id: orderId, body: "Hi T1 — my address is 12 Private Street" }), "A sends message");
must(await T1.client.from("messages").insert({ order_id: orderId, body: "Thanks, noted." }), "T1 sends message");

emptyRows(T2.label, "GET orders?id=eq.<order id>", await T2.client.from("orders").select("*").eq("id", orderId));
emptyRows(T2.label, "GET messages?order_id=eq.<order id>", await T2.client.from("messages").select("*").eq("order_id", orderId));
blocked(T2.label, "POST messages {order_id: <order id>} (write into their chat)",
  await T2.client.from("messages").insert({ order_id: orderId, body: "hello from outside" }).select(), "42501");
blocked(T2.label, "POST messages {sender_id: A} (impersonate the customer)",
  await T2.client.from("messages").insert({ order_id: orderId, sender_id: A.id, body: "spoof" }).select(), "42501");
if (B) {
  emptyRows(B.label, "GET messages?order_id=eq.<order id> (unrelated customer)",
    await B.client.from("messages").select("*").eq("order_id", orderId));
}
{
  const res = await T1.client.from("messages").select("body").eq("order_id", orderId);
  control(T1.label, "participant T1 reads the chat", "2 messages", res, res.data?.length === 2);
}

await sleep(3000);
channels.forEach((c, i) => [T1, T2][i].client.removeChannel(c));
if (subscribed.T1 && subscribed.T2 && heard.T1 > 0) {
  record({ who: T2.label, attempt: "Realtime: subscribe to messages for <order id>", expected: "0 live events (T1 heard them)",
    res: { data: `T2 received ${heard.T2} event(s); T1 received ${heard.T1}` }, pass: heard.T2 === 0 });
} else {
  console.log(`(Realtime check inconclusive: subscribed=${JSON.stringify(subscribed)} heard=${JSON.stringify(heard)} — skipped)`);
}

// ---------------------------------------------------------------------------
// #4 — Review an order that isn't completed, or someone else's order
// ---------------------------------------------------------------------------
heading("#4 Review a non-completed order / someone else's order", "Order status is 'accepted'. Try to review it early, and as outsiders.");

blocked(A.label, "rpc create_review on own order while status = accepted",
  await A.client.rpc("create_review", { p_order_id: orderId, p_rating: 5, p_comment: "early" }), "ORDER_NOT_COMPLETED");
blocked(A.label, "POST reviews directly (skip the RPC checks)",
  await A.client.from("reviews").insert({ order_id: orderId, customer_id: A.id, tailor_id: T1.id, rating: 5 }).select(), "42501");
blocked(T2.label, "rpc create_review on someone else's order",
  await T2.client.rpc("create_review", { p_order_id: orderId, p_rating: 1, p_comment: "sabotage" }), "ORDER_NOT_FOUND");
blocked(T1.label, "rpc create_review — tailor reviews themselves",
  await T1.client.rpc("create_review", { p_order_id: orderId, p_rating: 5, p_comment: "I'm great" }), "ONLY_CUSTOMER_CAN_REVIEW");

// Order state machine
blocked(A.label, "rpc advance_order — customer marks order completed",
  await A.client.rpc("advance_order", { p_order_id: orderId, p_to_status: "completed" }), "ONLY_TAILOR_CAN_UPDATE");
blocked(T1.label, "rpc advance_order accepted → completed (skip steps)",
  await T1.client.rpc("advance_order", { p_order_id: orderId, p_to_status: "completed" }), "INVALID_TRANSITION");
blocked(T1.label, "PATCH orders SET status='completed' directly",
  await T1.client.from("orders").update({ status: "completed" }).eq("id", orderId).select(), "42501");
blocked(T2.label, "rpc advance_order on someone else's order",
  await T2.client.rpc("advance_order", { p_order_id: orderId, p_to_status: "in_progress" }), "ORDER_NOT_FOUND");

for (const s of ["in_progress", "ready", "completed"]) must(await T1.client.rpc("advance_order", { p_order_id: orderId, p_to_status: s }), `advance ${s}`);
control(T1.label, "advance accepted → in_progress → ready → completed", "3 steps succeed", { data: "completed" }, true);
blocked(T1.label, "rpc advance_order backwards completed → in_progress",
  await T1.client.rpc("advance_order", { p_order_id: orderId, p_to_status: "in_progress" }), "INVALID_TRANSITION");

blocked(T2.label, "rpc create_review on someone else's completed order",
  await T2.client.rpc("create_review", { p_order_id: orderId, p_rating: 1, p_comment: "sabotage" }), "ORDER_NOT_FOUND");
if (B) {
  blocked(B.label, "rpc create_review on another customer's completed order",
    await B.client.rpc("create_review", { p_order_id: orderId, p_rating: 1, p_comment: "sabotage" }), "ORDER_NOT_FOUND");
}
{
  const res = await A.client.rpc("create_review", { p_order_id: orderId, p_rating: 5, p_comment: "Tampering test review." });
  control(A.label, "rpc create_review on own completed order", "review created", res, !res.error);
}
blocked(A.label, "rpc create_review a second time",
  await A.client.rpc("create_review", { p_order_id: orderId, p_rating: 1, p_comment: "again" }), "ALREADY_REVIEWED");

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
const attacks = results.filter((r) => r.kind === "attack");
const failed = results.filter((r) => !r.pass);
console.log(`\n${attacks.length} attack attempts, ${attacks.filter((r) => r.pass).length} blocked. ` +
  `${results.length - attacks.length} controls. ${failed.length ? `${failed.length} FAILED` : "All checks passed."}`);

const esc = (s) => String(s).replaceAll("|", "\\|").replaceAll("\n", " ");
let md = `# Tampering Test — raw results\n\n` +
  `Generated by \`scripts/tampering-test.mjs\` on ${startedAt.toISOString()} against \`${new globalThis.URL(URL).host}\`.\n` +
  `All calls use the publishable key plus a real user session — the same access a browser has.\n\n` +
  `**${attacks.length} attack attempts, ${attacks.filter((r) => r.pass).length} blocked; ` +
  `${results.length - attacks.length} controls (legitimate actions that must still work), ` +
  `${results.filter((r) => r.kind === "control" && r.pass).length} passed.**\n\n` +
  `Test data: request \`${request.id}\`, order \`${orderId}\`.\n`;
for (const s of sections) {
  md += `\n## ${s.title}\n\n${s.goal}\n\n| | Who | Attempt | Expected | Actual |\n|---|---|---|---|---|\n`;
  for (const r of results.filter((x) => x.section === s.title)) {
    md += `| ${r.pass ? "✅" : "❌"}${r.kind === "control" ? " control" : ""} | ${r.who} | ${esc(r.attempt)} | ${esc(r.expected)} | ${esc(r.actual)} |\n`;
  }
}
mkdirSync("docs", { recursive: true });
writeFileSync("docs/tampering-results.md", md);
console.log("Wrote docs/tampering-results.md");
process.exitCode = failed.length ? 1 : 0;
process.exit();
