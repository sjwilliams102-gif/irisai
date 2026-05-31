import React from "react";
import { VisionPlan, FormState, LensType, ADD_ONS } from "./types";
import { PROVIDERS } from "./defaultPlans";

interface Props {
  plan: VisionPlan;
  form: FormState;
  onChange: (form: FormState) => void;
  onCalculate: () => void;
}

const LENS_TYPES: { value: LensType; label: string }[] = [
  { value: "single", label: "Single Vision" },
  { value: "bifocal", label: "Bifocal" },
  { value: "progressive", label: "Progressive" },
];

export default function InsuranceForm({ plan, form, onChange, onCalculate }: Props) {
  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    onChange({ ...form, [key]: value });
  }

  function toggleAddOn(key: keyof FormState["addOns"]) {
    onChange({ ...form, addOns: { ...form.addOns, [key]: !form.addOns[key] } });
  }

  function getAddOnNote(key: keyof FormState["addOns"]): string {
    const copay =
      key === "antiGlare"
        ? plan.arCoatingCopay
        : key === "blueLight"
        ? plan.blueLightCopay
        : key === "photochromic"
        ? plan.photochromicCopay
        : plan.highIndexCopay;
    if (copay === null) return ADD_ONS.find((a) => a.key === key)!.coverageNote;
    if (copay === 0) return "Covered — no extra charge";
    return `Covered with $${copay} copay`;
  }

  return (
    <div className="card form-card">
      {plan.notes.length > 0 && (
        <div className="plan-notice">
          {plan.notes[0]}
        </div>
      )}

      <div className="form-section">
        <div className="form-label">Insurance Provider</div>
        <select
          className="form-select"
          value={form.provider}
          onChange={(e) => setField("provider", e.target.value)}
        >
          {PROVIDERS.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      <div className="form-divider" />

      <div className="form-section">
        <div className="form-label">Frame</div>
        <div className="sub-label">Frame Price</div>
        <div className="input-dollar-wrap">
          <span className="dollar-prefix">$</span>
          <input
            type="number"
            className="dollar-input"
            min="0"
            step="1"
            placeholder="e.g. 180"
            value={form.framePrice}
            onChange={(e) => setField("framePrice", e.target.value)}
          />
        </div>
        {form.framePrice && parseFloat(form.framePrice) > 0 && (
          <div className="allowance-hint">
            Frame allowance: <strong>${plan.frameAllowance}</strong>
            {parseFloat(form.framePrice) > plan.frameAllowance && (
              <span className="hint-over"> · ${(parseFloat(form.framePrice) - plan.frameAllowance).toFixed(2)} over</span>
            )}
          </div>
        )}
      </div>

      <div className="form-divider" />

      <div className="form-section">
        <div className="form-label">Lens Type</div>
        <div className="toggle-group">
          {LENS_TYPES.map(({ value, label }) => (
            <button
              key={value}
              className={`toggle-btn ${form.lensType === value ? "active" : ""}`}
              onClick={() => setField("lensType", value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="form-divider" />

      <div className="form-section">
        <div className="form-label">Lens Add-Ons</div>
        <div className="addon-list">
          {ADD_ONS.map((addon) => {
            const note = getAddOnNote(addon.key);
            const isCovered =
              (addon.key === "antiGlare" ? plan.arCoatingCopay :
               addon.key === "blueLight" ? plan.blueLightCopay :
               addon.key === "photochromic" ? plan.photochromicCopay :
               plan.highIndexCopay) !== null;
            return (
              <label key={addon.key} className={`addon-row ${form.addOns[addon.key] ? "checked" : ""}`}>
                <input
                  type="checkbox"
                  className="addon-checkbox"
                  checked={form.addOns[addon.key]}
                  onChange={() => toggleAddOn(addon.key)}
                />
                <div className="addon-text">
                  <span className="addon-name">{addon.label}</span>
                  <span className={`addon-note ${isCovered ? "covered" : ""}`}>{note}</span>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      <button className="btn-calculate" onClick={onCalculate}>
        Calculate Patient Price
      </button>
    </div>
  );
}
