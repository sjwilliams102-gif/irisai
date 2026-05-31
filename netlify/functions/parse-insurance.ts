import Anthropic from "@anthropic-ai/sdk";
import type { Handler } from "@netlify/functions";

const client = new Anthropic();

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
    return { statusCode: 405, headers: corsHeaders(), body: "Method not allowed" };
  }

  let planText: string;
  try {
    const body = JSON.parse(event.body ?? "{}");
    planText = body.planText ?? "";
  } catch {
    return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: "Invalid JSON body" }) };
  }

  if (!planText || planText.trim().length < 20) {
    return {
      statusCode: 400,
      headers: corsHeaders(),
      body: JSON.stringify({ error: "Plan text is too short to parse." }),
    };
  }

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
    const msg = err instanceof Error ? err.message : "Unknown error";
    return {
      statusCode: 500,
      headers: corsHeaders(),
      body: JSON.stringify({ error: `Parsing failed: ${msg}` }),
    };
  }
};

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}
