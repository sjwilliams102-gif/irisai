import Anthropic from "@anthropic-ai/sdk";
import type { Handler } from "@netlify/functions";

const SYSTEM_PROMPT = `You are an expert vision insurance analyst.
Given raw vision insurance plan text pasted by a patient, extract the coverage details.
Return ONLY a valid JSON object — no markdown, no code fences, no explanation.

JSON schema:
{
  "provider": string,                // e.g. "VSP", "EyeMed", "Davis Vision", "Cigna Vision", "Superior Vision", "Other"
  "frameAllowance": number,          // dollar allowance for frames, 0 if none
  "singleVisionCopay": number,       // patient copay for single vision lenses
  "bifocalCopay": number,
  "progressiveCopay": number,
  "arCoatingCopay": number | null,   // null = NOT covered; 0 = covered free; >0 = patient copay
  "blueLightCopay": number | null,
  "photochromicCopay": number | null,
  "highIndexCopay": number | null,
  "contactAllowance": number,        // dollar allowance for contact lenses, 0 if none
  "examCopay": number,               // patient copay for routine eye exam
  "confidence": "high" | "medium" | "low",
  "notes": string[]                  // up to 3 short notes about ambiguities or unusual terms
}

Rules:
- Use 0 for dollar amounts not mentioned (do NOT use null for allowances/copays)
- null is ONLY valid for the add-on copay fields and means "not covered by plan"
- If lenses are covered in full with no copay, use 0 for that copay
- Identify the provider from known names; default to "Other" if unrecognized
- confidence: "high" if most fields found, "medium" if partial, "low" if very little info
`;

export const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders(), body: "" };
  }

  if (event.httpMethod !== "POST") {
    return jsonError(405, "Method not allowed.", "method_not_allowed");
  }

  // Verify the service is configured before doing anything else.
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    return jsonError(
      503,
      "AI extraction isn't configured on the server (ANTHROPIC_API_KEY is missing). You can still enter your plan details manually below.",
      "missing_key"
    );
  }

  let planText: string;
  try {
    const body = JSON.parse(event.body ?? "{}");
    planText = body.planText ?? "";
  } catch {
    return jsonError(400, "Invalid request body.", "bad_request");
  }

  if (!planText || planText.trim().length < 20) {
    return jsonError(400, "Plan text is too short to parse — paste a bit more detail.", "too_short");
  }

  const client = new Anthropic({ apiKey });

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Parse this vision insurance plan text and return the JSON:\n\n${planText.slice(0, 8000)}`,
        },
      ],
    });

    const rawText = message.content[0].type === "text" ? message.content[0].text : "";
    const cleaned = rawText.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();
    const parsed = JSON.parse(cleaned);

    return {
      statusCode: 200,
      headers: { ...corsHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(parsed),
    };
  } catch (err: unknown) {
    const { status, message, code } = classifyError(err);
    return jsonError(status, message, code);
  }
};

/** Map SDK / runtime errors to clear, user-facing messages. */
function classifyError(err: unknown): { status: number; message: string; code: string } {
  if (err instanceof Anthropic.APIConnectionError) {
    return {
      status: 502,
      code: "unreachable",
      message: "Couldn't reach the AI service. Please check your connection and try again.",
    };
  }
  if (err instanceof Anthropic.APIError) {
    const s = err.status ?? 500;
    if (s === 401 || s === 403) {
      return {
        status: 401,
        code: "bad_key",
        message: "AI authentication failed — the ANTHROPIC_API_KEY appears to be invalid. Check the key in your Netlify settings.",
      };
    }
    if (s === 429) {
      return {
        status: 429,
        code: "rate_limit",
        message: "The AI service is busy right now (rate limit). Please wait a moment and try again.",
      };
    }
    if (s >= 500) {
      return {
        status: 502,
        code: "upstream",
        message: "The AI service is temporarily unavailable. Please try again shortly.",
      };
    }
    return { status: s, code: "api_error", message: `AI request failed (${s}).` };
  }
  if (err instanceof SyntaxError) {
    return {
      status: 502,
      code: "bad_response",
      message: "The AI returned a response that couldn't be read. Please try again.",
    };
  }
  const m = err instanceof Error ? err.message : "Unknown error";
  return { status: 500, code: "unknown", message: `Parsing failed: ${m}` };
}

function jsonError(statusCode: number, error: string, code: string) {
  return {
    statusCode,
    headers: { ...corsHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ error, code }),
  };
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}
