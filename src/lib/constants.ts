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

// ---------------------------------------------------------------------------
// Size & measurements (all measurements in centimetres)
// ---------------------------------------------------------------------------

export const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"] as const;

export type MeasurementKey =
  | "height"
  | "chest"
  | "bust"
  | "waist"
  | "hips"
  | "shoulders"
  | "sleeve"
  | "inseam"
  | "neck"
  | "length"
  | "thigh";

export const MEASUREMENTS: Record<MeasurementKey, { label: string; tip: string }> = {
  height: { label: "Height", tip: "Standing straight, without shoes." },
  chest: { label: "Chest", tip: "Around the fullest part, under the arms." },
  bust: { label: "Bust", tip: "Around the fullest part of the bust." },
  waist: { label: "Waist", tip: "Around your natural waistline." },
  hips: { label: "Hips", tip: "Around the fullest part of the hips." },
  shoulders: { label: "Shoulder width", tip: "From one shoulder point to the other, across the back." },
  sleeve: { label: "Sleeve length", tip: "From shoulder point to wrist, arm slightly bent." },
  inseam: { label: "Inseam", tip: "From the crotch to the ankle, inside the leg." },
  neck: { label: "Neck", tip: "Around the base of the neck, one finger loose." },
  length: { label: "Garment length", tip: "From the shoulder to where the garment should end." },
  thigh: { label: "Thigh", tip: "Around the fullest part of the thigh." },
};

/** The measurements that matter most for each garment — shown in this order. */
export const MEASUREMENTS_BY_GARMENT: Record<string, MeasurementKey[]> = {
  suit: ["chest", "waist", "shoulders", "sleeve", "neck", "inseam", "height"],
  dress: ["bust", "waist", "hips", "shoulders", "length", "height"],
  shirt: ["neck", "chest", "waist", "shoulders", "sleeve"],
  trousers: ["waist", "hips", "inseam", "thigh"],
  traditional: ["height", "chest", "shoulders", "sleeve", "neck", "length"],
  outerwear: ["chest", "shoulders", "sleeve", "length", "height"],
  alteration: ["chest", "waist", "hips", "shoulders", "sleeve", "inseam"],
  other: ["height", "chest", "waist", "hips", "shoulders", "sleeve", "inseam"],
};

export function measurementsFor(garment: string): MeasurementKey[] {
  return MEASUREMENTS_BY_GARMENT[garment] ?? MEASUREMENTS_BY_GARMENT.other;
}

/** Keep only filled, valid values; returns null when nothing was entered. */
export function cleanMeasurements(input: Record<string, string | number | undefined> | null | undefined) {
  if (!input) return { data: null as Record<string, number> | null, errors: {} as Record<string, string> };
  const data: Record<string, number> = {};
  const errors: Record<string, string> = {};
  for (const [key, raw] of Object.entries(input)) {
    if (!(key in MEASUREMENTS)) continue;
    const text = String(raw ?? "").trim().replace(",", ".");
    if (!text) continue;
    const n = Number(text);
    if (!Number.isFinite(n) || n < 1 || n > 300) {
      errors[`m_${key}`] = "Enter a number in cm (1–300).";
      continue;
    }
    data[key] = Math.round(n * 10) / 10;
  }
  return { data: Object.keys(data).length ? data : null, errors };
}
