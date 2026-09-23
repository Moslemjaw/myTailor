import type { OfferStatus, OrderStatus, RequestStatus } from "./types";

export const GARMENT_TYPES = [
  { value: "suit", label: "Suit" },
  { value: "dress", label: "Dress" },
  { value: "shirt", label: "Shirt" },
  { value: "trousers", label: "Trousers" },
  { value: "traditional", label: "Traditional wear" },
  { value: "outerwear", label: "Outerwear" },
  { value: "alteration", label: "Alteration" },
  { value: "other", label: "Something else" },
] as const;

export function garmentLabel(value: string) {
  return GARMENT_TYPES.find((g) => g.value === value)?.label ?? "Garment";
}

export const TAILOR_SPECIALTIES = [
  "Suits & tailoring",
  "Evening wear",
  "Bridal",
  "Traditional wear",
  "Abayas",
  "Dishdashas",
  "Shirts",
  "Alterations",
  "Outerwear",
  "Womenswear",
  "Menswear",
  "Childrenswear",
];

export const CURRENCY = "KD";

export const REQUEST_STATUS: Record<RequestStatus, { label: string; tone: Tone }> = {
  open: { label: "Open for offers", tone: "accent" },
  closed: { label: "Closed", tone: "neutral" },
};

export const OFFER_STATUS: Record<OfferStatus, { label: string; tone: Tone }> = {
  pending: { label: "Awaiting decision", tone: "warning" },
  accepted: { label: "Accepted", tone: "success" },
  declined: { label: "Declined", tone: "danger" },
  closed: { label: "Request closed", tone: "neutral" },
};

export const ORDER_STEPS: { status: OrderStatus; label: string; description: string }[] = [
  { status: "accepted", label: "Accepted", description: "Offer accepted and order created." },
  { status: "in_progress", label: "In progress", description: "The tailor is working on the garment." },
  { status: "ready", label: "Ready", description: "The garment is ready for collection or fitting." },
  { status: "completed", label: "Completed", description: "The order is finished." },
];

export const ORDER_STATUS: Record<OrderStatus, { label: string; tone: Tone }> = {
  accepted: { label: "Accepted", tone: "accent" },
  in_progress: { label: "In progress", tone: "info" },
  ready: { label: "Ready", tone: "warning" },
  completed: { label: "Completed", tone: "success" },
};

/** The single next step a tailor can take — there is no way to skip. */
export const NEXT_ORDER_ACTION: Partial<
  Record<OrderStatus, { to: OrderStatus; label: string; confirm: string; hint: string }>
> = {
  accepted: {
    to: "in_progress",
    label: "Start work",
    confirm: "Let your customer know you've started working on their order.",
    hint: "Once you've agreed on measurements and fabric, start work.",
  },
  in_progress: {
    to: "ready",
    label: "Mark as ready",
    confirm: "Your customer will be told the garment is ready for collection or fitting.",
    hint: "When the garment is finished, mark it as ready.",
  },
  ready: {
    to: "completed",
    label: "Mark as completed",
    confirm: "Complete this order once the customer has their garment. They'll be invited to leave a review.",
    hint: "After handover, complete the order.",
  },
};

export type Tone = "neutral" | "accent" | "success" | "warning" | "danger" | "info";
