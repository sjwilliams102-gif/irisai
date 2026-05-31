import { VisionPlan, FormState, CalculationResult, ADD_ONS, WhatIfScenario } from "./types";

const CONTACT_MARKET_PRICE = 300;

export function calculateCoverage(plan: VisionPlan, form: FormState): CalculationResult {
  const framePrice = parseFloat(form.framePrice) || 0;

  const frameAllowanceApplied = Math.min(framePrice, plan.frameAllowance);
  const framePatientCost = Math.max(0, framePrice - plan.frameAllowance);

  const lensCost =
    form.lensType === "single"
      ? plan.singleVisionCopay
      : form.lensType === "bifocal"
      ? plan.bifocalCopay
      : plan.progressiveCopay;

  const addOnLines = ADD_ONS.filter((a) => form.addOns[a.key]).map((a) => {
    const planCopay =
      a.key === "antiGlare"
        ? plan.arCoatingCopay
        : a.key === "blueLight"
        ? plan.blueLightCopay
        : a.key === "photochromic"
        ? plan.photochromicCopay
        : plan.highIndexCopay;

    return {
      label: a.label,
      cost: planCopay === null ? a.marketPrice : planCopay,
      covered: planCopay !== null,
    };
  });

  const addOnTotal = addOnLines.reduce((s, l) => s + l.cost, 0);
  const total = framePatientCost + lensCost + addOnTotal;

  const explanation = buildExplanation(plan, form, framePrice, frameAllowanceApplied, framePatientCost, lensCost, addOnLines);
  const whatIf = buildWhatIf(plan, form, framePrice, total);

  return { framePatientCost, frameAllowanceApplied, lensCost, addOnLines, total, explanation, whatIf };
}

function buildExplanation(
  plan: VisionPlan,
  form: FormState,
  framePrice: number,
  allowanceApplied: number,
  framePatient: number,
  lensCost: number,
  addOns: CalculationResult["addOnLines"]
): string {
  const parts: string[] = [];

  if (framePrice > 0) {
    if (framePatient === 0) {
      parts.push(
        `Your ${plan.provider} frame allowance of $${plan.frameAllowance} fully covers your $${framePrice} frame.`
      );
    } else {
      parts.push(
        `Your ${plan.provider} plan covers $${allowanceApplied} of your $${framePrice} frame, leaving $${framePatient.toFixed(2)} for you.`
      );
    }
  }

  const lensLabel =
    form.lensType === "single"
      ? "Single vision lenses"
      : form.lensType === "bifocal"
      ? "Bifocal lenses"
      : "Progressive lenses";

  if (lensCost === 0) {
    parts.push(`${lensLabel} are covered in full with no copay.`);
  } else {
    parts.push(`${lensLabel} have a $${lensCost} copay.`);
  }

  for (const line of addOns) {
    if (line.covered && line.cost === 0) {
      parts.push(`${line.label} is included at no charge.`);
    } else if (line.covered) {
      parts.push(`${line.label} has a $${line.cost} copay.`);
    } else {
      parts.push(`${line.label} isn't covered by your plan; the $${line.cost} market price applies.`);
    }
  }

  return parts.join(" ");
}

function buildWhatIf(plan: VisionPlan, form: FormState, framePrice: number, currentTotal: number): WhatIfScenario[] {
  const scenarios: WhatIfScenario[] = [];

  const hasAddOns = Object.values(form.addOns).some(Boolean);
  if (hasAddOns) {
    const noAddOn = calculateCoverage(plan, {
      ...form,
      addOns: { antiGlare: false, blueLight: false, photochromic: false, highIndex: false },
    });
    if (noAddOn.total < currentTotal) {
      scenarios.push({ label: "Skip all add-ons", newTotal: noAddOn.total });
    }
  }

  if (framePrice > 100) {
    const basicResult = calculateCoverage(plan, { ...form, framePrice: "100" });
    if (basicResult.total < currentTotal) {
      scenarios.push({ label: "Choose a $100 frame", newTotal: basicResult.total, note: "Fully within your frame allowance on most plans" });
    }
  }

  const contactPatient = Math.max(0, CONTACT_MARKET_PRICE - plan.contactAllowance);
  scenarios.push({
    label: "Switch to contact lenses",
    newTotal: contactPatient,
    note: `Est. $${CONTACT_MARKET_PRICE} annual supply · $${plan.contactAllowance} benefit applied`,
  });

  return scenarios;
}
