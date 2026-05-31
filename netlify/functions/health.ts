import type { Handler } from "@netlify/functions";

/**
 * Lightweight health check for the AI extraction service.
 * Only verifies the API key is configured on the server — it does NOT
 * make a billed API call. An invalid (but present) key will surface as a
 * clear "bad_key" error on the first real parse request instead.
 */
export const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders(), body: "" };
  }

  const hasKey = Boolean(process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.trim());

  return {
    statusCode: 200,
    headers: { ...corsHeaders(), "Content-Type": "application/json", "Cache-Control": "no-store" },
    body: JSON.stringify({
      ok: hasKey,
      service: "parse-insurance",
      reason: hasKey ? null : "missing_key",
    }),
  };
};

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
  };
}
