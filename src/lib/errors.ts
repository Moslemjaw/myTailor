/**
 * Maps database/auth error codes to messages written for people, not
 * developers. Raw errors are logged server-side and never shown.
 */
const MESSAGES: Record<string, string> = {
  NOT_AUTHENTICATED: "Please sign in to continue.",
  FORBIDDEN: "You don't have permission to perform this action.",
  ONLY_TAILORS_CAN_OFFER: "Only tailor accounts can make offers.",
  REQUEST_NOT_FOUND: "This request isn't available.",
  REQUEST_CLOSED: "This request is no longer accepting offers.",
  OFFER_NOT_FOUND: "This offer isn't available.",
  OFFER_NOT_PENDING: "This offer can't be selected right now. It may have been declined or revised.",
  OFFER_LOCKED: "This offer can no longer be changed.",
  INVALID_OFFER: "Please check the price, turnaround and message.",
  ORDER_NOT_FOUND: "This order isn't available.",
  ONLY_TAILOR_CAN_UPDATE: "Only the tailor can update the progress of this order.",
  INVALID_TRANSITION: "This order cannot move to this status.",
  ONLY_CUSTOMER_CAN_REVIEW: "Only the customer who placed this order can review it.",
  ORDER_NOT_COMPLETED: "You can review this order after it is completed.",
  ALREADY_REVIEWED: "You've already reviewed this order.",
  INVALID_RATING: "Please choose a rating from 1 to 5 stars.",
  INVALID_REVIEW: "Your review is a little long. Please shorten it.",
  INVALID_ROLE: "Please choose whether you're joining as a customer or a tailor.",
};

const GENERIC = "Something went wrong. Please try again.";

type ErrLike = { message?: string; code?: string; status?: number } | null | undefined;

export function friendlyError(error: ErrLike, fallback = GENERIC): string {
  if (!error) return fallback;
  const raw = error.message ?? "";
  const code = Object.keys(MESSAGES).find((k) => raw === k || raw.includes(k));
  if (code) return MESSAGES[code];

  // Postgres / PostgREST
  if (error.code === "42501" || /row-level security|permission denied/i.test(raw)) return MESSAGES.FORBIDDEN;
  if (error.code === "23505") return "That's already been done.";
  if (error.code === "23514") return "Some details aren't valid. Please check the form.";
  if (error.code === "PGRST116") return "We couldn't find what you were looking for.";

  // Auth
  if (/invalid login credentials/i.test(raw)) return "That email and password don't match. Please try again.";
  if (/email not confirmed/i.test(raw)) return "Please confirm your email address first — check your inbox for the link.";
  if (/user already registered|already been registered/i.test(raw)) return "An account with this email already exists. Try signing in instead.";
  if (/password should be at least|weak password/i.test(raw)) return "Please choose a stronger password (at least 8 characters).";
  if (/email rate limit/i.test(raw)) return "We can’t send sign-up emails right now. Please try again in a little while.";
  if (/rate limit|too many requests/i.test(raw) || error.status === 429) return "Too many attempts. Please wait a moment and try again.";
  if (/signups? (are |is )?(disabled|not allowed)/i.test(raw)) return "New accounts can’t be created right now. Please try again later.";
  if (/fetch failed|network/i.test(raw)) return "We couldn't reach the server. Check your connection and try again.";

  return fallback;
}

export function logError(scope: string, error: unknown) {
  // Server logs only.
  console.error(`[mytailor:${scope}]`, error);
}
