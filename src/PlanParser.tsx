import React, { useState } from "react";
import { VisionPlan } from "./types";

interface Props {
  onPlanExtracted: (plan: VisionPlan) => void;
}

export default function PlanParser({ onPlanExtracted }: Props) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleExtract() {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/.netlify/functions/parse-insurance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planText: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Extraction failed");
      onPlanExtracted(data as VisionPlan);
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card paste-card">
      <div className="paste-card-header">
        <div className="paste-card-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span>Paste Patient Plan Info</span>
        </div>
        <span className="ai-badge">AI</span>
      </div>

      <p className="paste-desc">
        Paste any text from a VSP/EyeMed portal, EOB, or benefits printout. AI will extract the
        allowances and copays and fill the fields automatically.
      </p>

      <textarea
        className="paste-textarea"
        value={text}
        onChange={(e) => { setText(e.target.value); setSuccess(false); }}
        placeholder={
          "e.g. 'VSP Choice Plan — Frame allowance $150, Single vision\ncopay $10, Progressive copay $95, AR coating $45...'\n\nOr paste a full benefits summary. Any format works."
        }
        rows={5}
        disabled={loading}
      />

      {error && <div className="parse-error-msg">{error}</div>}
      {success && <div className="parse-success-msg">Plan extracted — fields updated below.</div>}

      <button className="btn-extract" onClick={handleExtract} disabled={loading || !text.trim()}>
        {loading ? (
          <>
            <span className="spinner" />
            Extracting...
          </>
        ) : (
          <>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="15" height="15">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            Extract Plan Details with AI
          </>
        )}
      </button>
    </div>
  );
}
