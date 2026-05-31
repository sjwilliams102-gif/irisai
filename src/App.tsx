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

export default function App() {
  const [plan, setPlan] = useState<VisionPlan>(DEFAULT_PLANS["VSP"]);
  const [form, setForm] = useState<FormState>(initialForm);
  const [result, setResult] = useState<CalculationResult | null>(null);

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

      <main className="main-grid">
        <div className="left-col">
          <PlanParser onPlanExtracted={handlePlanExtracted} />
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
