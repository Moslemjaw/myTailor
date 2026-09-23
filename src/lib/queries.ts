import "server-only";
import { createClient } from "./supabase/server";
import type {
  FeedRequest,
  Measurements,
  Message,
  Notification,
  Offer,
  OfferRevision,
  OfferStatus,
  Order,
  OrderStatus,
  Profile,
  Review,
  TailorRequest,
  TailorStats,
} from "./types";

/**
 * Read models for each screen. Every query runs as the signed-in user, so RLS
 * is the final word — these functions just ask for the minimum each screen
 * needs. Tailor-facing queries never select other tailors' offers; the only
 * competition signal they receive is a count from `request_offer_count`.
 */

/** PostgREST returns one-to-one embeds as an object, but be defensive. */
export function one<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

type PublicProfile = Pick<Profile, "id" | "full_name" | "city">;
type TailorCardProfile = Pick<Profile, "id" | "full_name" | "city" | "specialties" | "years_experience">;

// ---------------------------------------------------------------------------
// Customer
// ---------------------------------------------------------------------------

export type CustomerRequestRow = TailorRequest & {
  offers: Pick<Offer, "id" | "status" | "updated_at">[];
  order: Pick<Order, "id" | "order_number" | "status"> | null;
};

export async function getCustomerRequests(customerId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("requests")
    .select("*, offers(id, status, updated_at), order:orders(id, order_number, status)")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => ({ ...r, order: one(r.order) })) as CustomerRequestRow[];
}

export type OfferWithTailor = Offer & { tailor: TailorCardProfile | null };

export async function getCustomerRequestDetail(requestId: string, customerId: string) {
  const supabase = await createClient();
  const { data: request } = await supabase
    .from("requests")
    .select("*")
    .eq("id", requestId)
    .eq("customer_id", customerId)
    .maybeSingle<TailorRequest>();
  if (!request) return null;

  const [{ data: offers }, { data: order }, { data: measurementRow }] = await Promise.all([
    supabase
      .from("offers")
      .select(
        "id, request_id, tailor_id, price, turnaround_days, message, status, revision, created_at, updated_at, decided_at, tailor:profiles!offers_tailor_id_fkey(id, full_name, city, specialties, years_experience)",
      )
      .eq("request_id", requestId)
      .order("created_at", { ascending: true }),
    supabase.from("orders").select("id, order_number, status").eq("request_id", requestId).maybeSingle(),
    supabase.from("request_measurements").select("data").eq("request_id", requestId).maybeSingle(),
  ]);

  const list = ((offers ?? []) as unknown as OfferWithTailor[]).map((o) => ({ ...o, tailor: one(o.tailor) }));
  const stats = await getTailorStats(list.map((o) => o.tailor_id));
  return {
    request,
    offers: list,
    stats,
    order: order as Pick<Order, "id" | "order_number" | "status"> | null,
    measurements: (measurementRow?.data as Measurements | undefined) ?? null,
  };
}

// ---------------------------------------------------------------------------
// Tailor
// ---------------------------------------------------------------------------

export async function getTailorFeed() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("tailor_request_feed");
  if (error) throw error;
  return (data ?? []) as FeedRequest[];
}

export type TailorRequestView = Pick<
  TailorRequest,
  | "id"
  | "title"
  | "description"
  | "garment_type"
  | "desired_date"
  | "image_path"
  | "status"
  | "created_at"
  | "updated_at"
  | "size"
  | "has_measurements"
> & { customer: { city: string | null } | null };

export async function getTailorRequestDetail(requestId: string, tailorId: string) {
  const supabase = await createClient();
  const { data: request } = await supabase
    .from("requests")
    .select(
      "id, title, description, garment_type, desired_date, image_path, status, created_at, updated_at, size, has_measurements, customer:profiles!requests_customer_id_fkey(city)",
    )
    .eq("id", requestId)
    .maybeSingle();
  if (!request) return null;

  // Only ever the caller's own offer.
  const { data: myOffer } = await supabase
    .from("offers")
    .select("*")
    .eq("request_id", requestId)
    .eq("tailor_id", tailorId)
    .maybeSingle<Offer>();

  const [revisions, countRes, orderRes] = await Promise.all([
    myOffer
      ? supabase
          .from("offer_revisions")
          .select("*")
          .eq("offer_id", myOffer.id)
          .order("revision", { ascending: false })
          .then((r) => (r.data ?? []) as OfferRevision[])
      : Promise.resolve([] as OfferRevision[]),
    supabase.rpc("request_offer_count", { p_request_id: requestId }),
    supabase
      .from("orders")
      .select("id, order_number, status")
      .eq("request_id", requestId)
      .eq("tailor_id", tailorId)
      .maybeSingle(),
  ]);

  return {
    request: { ...request, customer: one(request.customer) } as TailorRequestView,
    myOffer: myOffer ?? null,
    revisions,
    offerCount: (countRes.data as number | null) ?? 0,
    order: orderRes.data as Pick<Order, "id" | "order_number" | "status"> | null,
  };
}

export type MyOfferRow = Offer & {
  request: Pick<TailorRequest, "id" | "title" | "garment_type" | "status" | "desired_date" | "image_path"> | null;
  order: Pick<Order, "id" | "order_number" | "status"> | null;
};

export async function getMyOffers(tailorId: string) {
  const supabase = await createClient();
  const [{ data: offers, error }, { data: orders }] = await Promise.all([
    supabase
      .from("offers")
      .select("*, request:requests(id, title, garment_type, status, desired_date, image_path)")
      .eq("tailor_id", tailorId)
      .order("updated_at", { ascending: false }),
    supabase.from("orders").select("id, offer_id, order_number, status").eq("tailor_id", tailorId),
  ]);
  if (error) throw error;
  const byOffer = new Map((orders ?? []).map((o) => [o.offer_id as string, o]));
  return (offers ?? []).map((o) => ({
    ...o,
    request: one(o.request),
    order: byOffer.get(o.id) ?? null,
  })) as MyOfferRow[];
}

// ---------------------------------------------------------------------------
// Orders (both roles — participants only via RLS)
// ---------------------------------------------------------------------------

export type OrderRow = Order & {
  request: Pick<TailorRequest, "id" | "title" | "garment_type" | "image_path" | "desired_date"> | null;
  customer: PublicProfile | null;
  tailor: PublicProfile | null;
  review: Pick<Review, "id" | "rating"> | null;
};

const ORDER_SELECT =
  "*, request:requests(id, title, garment_type, image_path, desired_date), customer:profiles!orders_customer_id_fkey(id, full_name, city), tailor:profiles!orders_tailor_id_fkey(id, full_name, city), review:reviews(id, rating)";

function normalizeOrder(o: Record<string, unknown>) {
  return {
    ...o,
    request: one(o.request as never),
    customer: one(o.customer as never),
    tailor: one(o.tailor as never),
    review: one(o.review as never),
  } as OrderRow;
}

export async function getOrders(viewerId: string, role: "customer" | "tailor") {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .eq(role === "customer" ? "customer_id" : "tailor_id", viewerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(normalizeOrder);
}

export type OrderEvent = { id: string; from_status: OrderStatus | null; to_status: OrderStatus; created_at: string };

export async function getOrderDetail(orderId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("orders").select(ORDER_SELECT).eq("id", orderId).maybeSingle();
  if (!data) return null; // Not a participant, or doesn't exist — same answer.
  const order = normalizeOrder(data);

  const [{ data: request }, { data: offer }, { data: events }, { data: review }, { data: measurementRow }] = await Promise.all([
    supabase.from("requests").select("id, title, description, garment_type, desired_date, image_path, created_at, size").eq("id", order.request_id).maybeSingle(),
    supabase.from("offers").select("message").eq("id", order.offer_id).maybeSingle(),
    supabase.from("order_events").select("id, from_status, to_status, created_at").eq("order_id", orderId).order("created_at"),
    supabase.from("reviews").select("*").eq("order_id", orderId).maybeSingle<Review>(),
    supabase.from("request_measurements").select("data").eq("request_id", order.request_id).maybeSingle(),
  ]);

  return {
    order,
    request: request as Pick<TailorRequest, "id" | "title" | "description" | "garment_type" | "desired_date" | "image_path" | "created_at" | "size"> | null,
    measurements: (measurementRow?.data as Measurements | undefined) ?? null,
    offerMessage: (offer?.message as string | undefined) ?? null,
    events: (events ?? []) as OrderEvent[],
    review: review ?? null,
  };
}

export async function getMessages(orderId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("messages")
    .select("id, order_id, sender_id, body, created_at")
    .eq("order_id", orderId)
    .order("created_at", { ascending: true })
    .limit(500);
  if (error) throw error;
  return (data ?? []) as Message[];
}

export type Conversation = OrderRow & { last: Pick<Message, "body" | "created_at" | "sender_id"> | null };

export async function getConversations(viewerId: string, role: "customer" | "tailor") {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(`${ORDER_SELECT}, messages(body, created_at, sender_id)`)
    .eq(role === "customer" ? "customer_id" : "tailor_id", viewerId)
    .order("created_at", { referencedTable: "messages", ascending: false })
    .limit(1, { referencedTable: "messages" });
  if (error) throw error;
  const rows = (data ?? []).map((o) => ({
    ...normalizeOrder(o),
    last: ((o as { messages?: Message[] }).messages ?? [])[0] ?? null,
  })) as Conversation[];
  return rows.sort((a, b) => {
    const ta = new Date(a.last?.created_at ?? a.created_at).getTime();
    const tb = new Date(b.last?.created_at ?? b.created_at).getTime();
    return tb - ta;
  });
}

// ---------------------------------------------------------------------------
// Shared
// ---------------------------------------------------------------------------

export async function getTailorStats(tailorIds: string[]) {
  const map = new Map<string, TailorStats>();
  const ids = [...new Set(tailorIds)];
  if (!ids.length) return map;
  const supabase = await createClient();
  const { data } = await supabase.rpc("tailor_stats", { p_tailor_ids: ids });
  for (const s of (data ?? []) as TailorStats[]) map.set(s.tailor_id, s);
  return map;
}

export async function getNotifications(limit = 60) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as Notification[];
}

export async function getTailorProfile(tailorId: string) {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, full_name, city, bio, specialties, years_experience, created_at")
    .eq("id", tailorId)
    .eq("role", "tailor")
    .maybeSingle<Profile>();
  if (!profile) return null;
  const [stats, { data: reviews }] = await Promise.all([
    getTailorStats([tailorId]),
    supabase
      .from("reviews")
      .select("id, rating, comment, created_at, customer:profiles!reviews_customer_id_fkey(full_name)")
      .eq("tailor_id", tailorId)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);
  return {
    profile,
    stats: stats.get(tailorId) ?? null,
    reviews: (reviews ?? []).map((r) => ({ ...r, customer: one(r.customer) })) as (Pick<Review, "id" | "rating" | "comment" | "created_at"> & {
      customer: { full_name: string } | null;
    })[],
  };
}

export function offerCounts(offers: { status: OfferStatus }[]) {
  return {
    total: offers.length,
    pending: offers.filter((o) => o.status === "pending").length,
  };
}
