/**
 * Teaching demo (/demo/secrets): settings shared by both paths.
 * Nothing here is secret — in Path A it ships to the browser on purpose,
 * so students can find the system prompt next to the key in DevTools.
 */
export const DEMO_AI_URL = "https://openrouter.ai/api/v1/chat/completions";
export const DEMO_MODEL = "google/gemini-2.5-flash";
export const DEMO_SYSTEM_PROMPT =
  "You are MyTailor's tailoring assistant. Answer questions about fabrics, fit and garment care in two or three friendly sentences.";
export const DEMO_MAX_PROMPT = 500;
