import React, { useState, useEffect } from "react";
import "./App.css";
import PlanParser from "./PlanParser";
import InsuranceForm from "./InsuranceForm";
import ResultsPanel from "./ResultsPanel";
import { VisionPlan, FormState, CalculationResult } from "./types";
import { DEFAULT_PLANS } from "./defaultPlans";
import { calculateCoverage } from "./calculator";

const initialForm: FormState = {
  provider: "VSP",
  framePrice: "",
  lensType: "single",
  addOns: { antiGlare: false, blueLight: false, photochromic: false, highIndex: false },
};

type AiHealth = "checking" | "ok" | "unconfigured" | "error";

export default function App() {
  const [plan, setPlan] = useState<VisionPlan>(DEFAULT_PLANS["VSP"]);
  const [form, setForm] = useState<FormState>(initialForm);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [aiHealth, setAiHealth] = useState<AiHealth>("checking");

  useEffect(() => {
    let cancelled = false;
    fetch("/.netlify/functions/health")
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setAiHealth(d.ok ? "ok" : "unconfigured");
      })
      .catch(() => {
        if (!cancelled) setAiHealth("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const defaultPlan = DEFAULT_PLANS[form.provider];
    if (defaultPlan) setPlan(defaultPlan);
    setResult(null);
  }, [form.provider]);

  function handlePlanExtracted(p: VisionPlan) {
    setPlan(p);
    setForm((f) => ({ ...f, provider: p.provider }));
    setResult(null);
  }

  function handleFormChange(f: FormState) {
    setForm(f);
    setResult(null);
  }

  function handleCalculate() {
    setResult(calculateCoverage(plan, form));
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" width="28" height="28">
            <circle cx="14" cy="14" r="12" stroke="#0EA5E9" strokeWidth="2" />
            <circle cx="14" cy="14" r="5" fill="#0EA5E9" opacity="0.9" />
            <circle cx="14" cy="14" r="2" fill="white" />
          </svg>
          <span className="brand-name">Iris Ai</span>
        </div>
      </header>

      {(aiHealth === "unconfigured" || aiHealth === "error") && (
        <div className="health-banner">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span>
            {aiHealth === "unconfigured"
              ? "AI plan extraction isn't configured yet (server API key missing). You can still use the calculator manually below."
              : "AI plan extraction service is unavailable right now. You can still use the calculator manually below."}
          </span>
        </div>
      )}

      <main className="main-grid">
        <div className="left-col">
          <PlanParser onPlanExtracted={handlePlanExtracted} aiAvailable={aiHealth === "ok" || aiHealth === "checking"} />
          <InsuranceForm
            plan={plan}
            form={form}
            onChange={handleFormChange}
            onCalculate={handleCalculate}
          />
        </div>
        <div className="right-col">
          <ResultsPanel
            result={result}
            plan={plan}
            form={form}
            onCalculate={handleCalculate}
          />
        </div>
      </main>

      <div className="bottom-accent" />
    </div>
  );
}
