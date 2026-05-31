export interface VisionPlan {
  provider: string;
  frameAllowance: number;
  singleVisionCopay: number;
  bifocalCopay: number;
  progressiveCopay: number;
  arCoatingCopay: number | null;       // null = not covered, 0 = free, >0 = copay
  blueLightCopay: number | null;
  photochromicCopay: number | null;
  highIndexCopay: number | null;
  contactAllowance: number;
  examCopay: number;
  confidence: "high" | "medium" | "low";
  notes: string[];
}

export type LensType = "single" | "bifocal" | "progressive";

export interface AddOns {
  antiGlare: boolean;
  blueLight: boolean;
  photochromic: boolean;
  highIndex: boolean;
}

export interface FormState {
  provider: string;
  framePrice: string;
  lensType: LensType;
  addOns: AddOns;
}

export interface AddOnItem {
  key: keyof AddOns;
  label: string;
  coverageNote: string;
  marketPrice: number;
}

export const ADD_ONS: AddOnItem[] = [
  { key: "antiGlare", label: "Anti-Glare", coverageNote: "May not be covered", marketPrice: 50 },
  { key: "blueLight", label: "Blue Light Filter", coverageNote: "May not be covered", marketPrice: 50 },
  { key: "photochromic", label: "Photochromic (Transitions)", coverageNote: "Partial coverage may apply", marketPrice: 150 },
  { key: "highIndex", label: "High Index Upgrade", coverageNote: "May not be covered", marketPrice: 80 },
];

export interface CalcLineItem {
  label: string;
  cost: number;
  covered: boolean;
  allowanceApplied?: number;
}

export interface CalculationResult {
  framePatientCost: number;
  frameAllowanceApplied: number;
  lensCost: number;
  addOnLines: CalcLineItem[];
  total: number;
  explanation: string;
  whatIf: WhatIfScenario[];
}

export interface WhatIfScenario {
  label: string;
  newTotal: number;
  note?: string;
}
