export type Role = "customer" | "tailor";
export type RequestStatus = "open" | "closed";
export type OfferStatus = "pending" | "accepted" | "declined" | "closed";
export type OrderStatus = "accepted" | "in_progress" | "ready" | "completed";

export interface Profile {
  id: string;
  role: Role;
  full_name: string;
  city: string | null;
  bio: string | null;
  specialties: string[];
  years_experience: number | null;
  created_at: string;
}

export interface TailorRequest {
  id: string;
  customer_id: string;
  title: string;
  description: string;
  garment_type: string;
  desired_date: string;
  image_path: string | null;
  ai_assisted: boolean;
  status: RequestStatus;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
}

export interface Offer {
  id: string;
  request_id: string;
  tailor_id: string;
  price: number;
  turnaround_days: number;
  message: string;
  status: OfferStatus;
  revision: number;
  created_at: string;
  updated_at: string;
  decided_at: string | null;
}

export interface OfferRevision {
  id: string;
  offer_id: string;
  revision: number;
  price: number;
  turnaround_days: number;
  message: string;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: number;
  request_id: string;
  offer_id: string;
  customer_id: string;
  tailor_id: string;
  price: number;
  turnaround_days: number;
  status: OrderStatus;
  created_at: string;
  started_at: string | null;
  ready_at: string | null;
  completed_at: string | null;
}

export interface Message {
  id: string;
  order_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

export interface Review {
  id: string;
  order_id: string;
  customer_id: string;
  tailor_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  kind: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

export interface FeedRequest {
  id: string;
  title: string;
  description: string;
  garment_type: string;
  desired_date: string;
  image_path: string | null;
  created_at: string;
  updated_at: string;
  customer_city: string | null;
  offer_count: number;
  my_offer_status: OfferStatus | null;
}

export interface TailorStats {
  tailor_id: string;
  review_count: number;
  avg_rating: number | null;
  completed_orders: number;
}

/** Result shape returned by every server action. */
export type ActionResult<T = undefined> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };
