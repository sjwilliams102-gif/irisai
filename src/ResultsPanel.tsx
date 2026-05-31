import React from "react";
import { CalculationResult, FormState, VisionPlan } from "./types";

interface Props {
  result: CalculationResult | null;
  plan: VisionPlan;
  form: FormState;
  onCalculate: () => void;
}

export default function ResultsPanel({ result, plan: _plan, form: _form, onCalculate }: Props) {
  return (
    <div className="results-col">
      <TotalCard result={result} onCalculate={onCalculate} />
      <BreakdownCard result={result} />
      <ExplanationCard result={result} />
      <WhatIfCard result={result} />
    </div>
  );
}

function TotalCard({ result, onCalculate }: { result: CalculationResult | null; onCalculate: () => void }) {
  return (
    <div className="total-card">
      <div className="total-circles">
        <div className="circle circle-lg" />
        <div className="circle circle-sm" />
      </div>
      <div className="total-label">Patient Out-of-Pocket Total</div>
      <div className="total-amount">
        {result ? `$${result.total.toFixed(2)}` : "$—"}
      </div>
      {!result && (
        <button className="btn-fill" onClick={onCalculate}>
          Fill in the form and calculate
        </button>
      )}
    </div>
  );
}

function BreakdownCard({ result }: { result: CalculationResult | null }) {
  return (
    <div className="card result-card">
      <div className="result-card-header">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
          <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" />
          <line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
        </svg>
        Cost Breakdown
      </div>

      {!result ? (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1.5" width="40" height="40">
            <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
            <rect x="9" y="3" width="6" height="4" rx="1" ry="1" />
            <polyline points="9 12 11 14 15 10" />
          </svg>
          <div className="empty-title">No calculation yet</div>
          <div className="empty-sub">Click 'Calculate Patient Price' to see breakdown</div>
        </div>
      ) : (
        <div className="breakdown-lines">
          {parseFloat("0") >= 0 && (
            <BreakdownRow
              label="Frames"
              detail={result.frameAllowanceApplied > 0 ? `$${result.frameAllowanceApplied} allowance applied` : undefined}
              amount={result.framePatientCost}
            />
          )}
          <BreakdownRow label="Lenses" amount={result.lensCost} />
          {result.addOnLines.map((line) => (
            <BreakdownRow
              key={line.label}
              label={line.label}
              detail={line.covered ? "Covered" : "Not covered"}
              amount={line.cost}
              notCovered={!line.covered}
            />
          ))}
          <div className="breakdown-total-row">
            <span>Patient Total</span>
            <span>${result.total.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function BreakdownRow({
  label,
  detail,
  amount,
  notCovered,
}: {
  label: string;
  detail?: string;
  amount: number;
  notCovered?: boolean;
}) {
  return (
    <div className="breakdown-row">
      <div className="breakdown-row-left">
        <span className="breakdown-row-label">{label}</span>
        {detail && <span className={`breakdown-row-detail ${notCovered ? "not-covered" : ""}`}>{detail}</span>}
      </div>
      <span className="breakdown-row-amount">${amount.toFixed(2)}</span>
    </div>
  );
}

function ExplanationCard({ result }: { result: CalculationResult | null }) {
  return (
    <div className="card result-card">
      <div className="result-card-header">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        Explanation
      </div>

      {!result ? (
        <div className="empty-state">
          <div className="empty-title">Plain-language summary will appear here</div>
          <div className="empty-sub">Helps explain costs to the patient clearly</div>
        </div>
      ) : (
        <p className="explanation-text">{result.explanation}</p>
      )}
    </div>
  );
}

function WhatIfCard({ result }: { result: CalculationResult | null }) {
  return (
    <div className="card result-card">
      <div className="result-card-header">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        What If...
      </div>

      {!result ? (
        <div className="empty-state">
          <div className="empty-title">Run a calculation first</div>
          <div className="empty-sub">Quick scenario toggles will appear here</div>
        </div>
      ) : (
        <div className="whatif-list">
          {result.whatIf.map((s) => (
            <div key={s.label} className="whatif-row">
              <div className="whatif-left">
                <span className="whatif-label">{s.label}</span>
                {s.note && <span className="whatif-note">{s.note}</span>}
              </div>
              <span className="whatif-total">${s.newTotal.toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
