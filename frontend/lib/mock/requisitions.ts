import type { MaterialRequirement, PurchaseRequisition, RequirementValidation } from "@/types/procurement";

/**
 * The hero PR (PR-2026-00983) and its immediate neighbors are hand-curated
 * to match the reference screenshot exactly — headline text, priorities,
 * and status all quoted from it. The remaining ~30 PRs needed to make
 * "42 open PRs" plausible are generated deterministically below rather
 * than hand-authored one by one; see the note on `generatedRequisitions`.
 */

const heroMaterial: MaterialRequirement = {
  materialName: "Bearing Housing",
  partCode: "BH-2045",
  quantity: 200,
  unit: "unit",
  application: "Gearbox Assembly",
  drawingReference: "BH-2045-R3",
  drawingRevisionAvailable: false,
};

export const requisitions: PurchaseRequisition[] = [
  {
    id: "pr-00983",
    prNumber: "PR-2026-00983",
    material: heroMaterial,
    requiredDate: "2026-09-25",
    requestingDepartment: "Gear Manufacturing",
    status: "ANALYSIS_READY",
    exceptions: [],
    estimatedValue: { currency: "INR", amount: 282020 },
    createdAt: "2026-09-01T08:10:00+05:30",
    updatedAt: "2026-09-04T10:21:00+05:30",
    hasBeenAnalyzed: true,
  },
  {
    id: "pr-00976",
    prNumber: "PR-2026-00976",
    material: {
      materialName: "Gear Assembly",
      partCode: "GA-1180",
      quantity: 50,
      unit: "unit",
      application: "Transmission Line 2",
      drawingRevisionAvailable: true,
    },
    requiredDate: "2026-09-20",
    requestingDepartment: "Transmission Assembly",
    status: "RESPONSES_RECEIVED",
    exceptions: ["DELIVERY_RISK"],
    estimatedValue: { currency: "INR", amount: 194500 },
    createdAt: "2026-08-29T09:00:00+05:30",
    updatedAt: "2026-09-04T09:40:00+05:30",
    hasBeenAnalyzed: false,
  },
  {
    id: "pr-00971",
    prNumber: "PR-2026-00971",
    material: {
      materialName: "Bearing Set",
      partCode: "BS-3390",
      quantity: 120,
      unit: "unit",
      application: "Gear Coupling Line",
      drawingRevisionAvailable: true,
    },
    requiredDate: "2026-09-18",
    requestingDepartment: "Gear Manufacturing",
    status: "ANALYSIS_READY",
    exceptions: [],
    estimatedValue: { currency: "INR", amount: 152400 },
    createdAt: "2026-08-27T09:00:00+05:30",
    updatedAt: "2026-09-04T08:55:00+05:30",
    hasBeenAnalyzed: true,
  },
  {
    id: "pr-00968",
    prNumber: "PR-2026-00968",
    material: {
      materialName: "Shaft Assembly",
      partCode: "SA-2210",
      quantity: 80,
      unit: "unit",
      application: "Drive Line",
      drawingRevisionAvailable: true,
    },
    requiredDate: "2026-09-16",
    requestingDepartment: "Drive Systems",
    status: "RFQ_IN_PROGRESS",
    exceptions: [],
    estimatedValue: { currency: "INR", amount: 176000 },
    createdAt: "2026-08-25T09:00:00+05:30",
    updatedAt: "2026-09-04T09:58:00+05:30",
    hasBeenAnalyzed: false,
  },
  {
    id: "pr-00961",
    prNumber: "PR-2026-00961",
    material: {
      materialName: "Gear Coupling",
      partCode: "GC-1750",
      quantity: 25,
      unit: "unit",
      application: "Auxiliary Drive",
      drawingRevisionAvailable: false,
    },
    requiredDate: "2026-09-22",
    requestingDepartment: "Gear Manufacturing",
    status: "RECEIVED",
    exceptions: ["VALIDATION_FAILED"],
    estimatedValue: { currency: "INR", amount: 61250 },
    createdAt: "2026-09-03T09:00:00+05:30",
    updatedAt: "2026-09-04T08:10:00+05:30",
    hasBeenAnalyzed: false,
  },
];

export const heroRequirementValidation: RequirementValidation = {
  prId: "pr-00983",
  fields: [
    { field: "materialName", label: "Material", status: "CONFIRMED", confidence: 0.99 },
    { field: "quantity", label: "Quantity", status: "CONFIRMED", confidence: 0.99 },
    { field: "requiredDate", label: "Required date", status: "CONFIRMED", confidence: 0.97 },
    { field: "application", label: "Application", status: "INFERRED", confidence: 0.91 },
    { field: "drawingReference", label: "Specification", status: "MISSING" },
  ],
  blockingIssues: ["Drawing revision has not been provided."],
  evaluatedAt: "2026-09-04T08:12:00+05:30",
};

// ── Generated filler PRs ─────────────────────────────────────────────────
// The hero and its four neighbors above are hand-curated to match the
// reference screenshot precisely. The remaining volume needed for a
// believable "42 open PRs" dashboard is generated here from a small,
// deterministic template set — never hand-typed one at a time, and never
// randomized (a fixed seed list keeps output stable across builds/tests).
const FILLER_MATERIALS: { name: string; part: string; dept: string; unit: string }[] = [
  { name: "Hex Bolt M12", part: "HB-1120", dept: "Fastener Stores", unit: "box" },
  { name: "Roller Bearing", part: "RB-4410", dept: "Gear Manufacturing", unit: "unit" },
  { name: "Drive Coupling", part: "DC-2290", dept: "Drive Systems", unit: "unit" },
  { name: "Forged Flange", part: "FF-3301", dept: "Forging Shop", unit: "unit" },
  { name: "Spur Gear", part: "SG-1004", dept: "Gear Manufacturing", unit: "unit" },
  { name: "Retaining Ring", part: "RR-8820", dept: "Fastener Stores", unit: "box" },
  { name: "Housing Cover", part: "HC-5502", dept: "Assembly Line 1", unit: "unit" },
  { name: "Bevel Gear", part: "BG-1187", dept: "Gear Manufacturing", unit: "unit" },
];
const FILLER_STATUSES: PurchaseRequisition["status"][] = [
  "RECEIVED",
  "VALIDATING",
  "READY_FOR_SOURCING",
  "RFQ_IN_PROGRESS",
  "RESPONSES_RECEIVED",
  "AWAITING_APPROVAL",
  "PO_CREATED",
];

function generateRequisitions(count: number): PurchaseRequisition[] {
  const result: PurchaseRequisition[] = [];
  for (let i = 0; i < count; i++) {
    const template = FILLER_MATERIALS[i % FILLER_MATERIALS.length]!;
    const status = FILLER_STATUSES[i % FILLER_STATUSES.length]!;
    const prNumber = `PR-2026-${(908 - i).toString().padStart(5, "0")}`;
    result.push({
      id: `pr-gen-${i}`,
      prNumber,
      material: {
        materialName: template.name,
        partCode: template.part,
        quantity: 20 + ((i * 7) % 180),
        unit: template.unit,
        drawingRevisionAvailable: i % 4 !== 0,
      },
      requiredDate: `2026-10-${(2 + (i % 26)).toString().padStart(2, "0")}`,
      requestingDepartment: template.dept,
      status,
      exceptions: i % 9 === 0 ? ["NO_SUPPLIER_RESPONSE"] : [],
      estimatedValue: { currency: "INR", amount: 40000 + i * 3175 },
      createdAt: "2026-08-15T09:00:00+05:30",
      updatedAt: "2026-09-03T09:00:00+05:30",
      hasBeenAnalyzed: status === "AWAITING_APPROVAL" || status === "PO_CREATED",
    });
  }
  return result;
}

export const generatedRequisitions = generateRequisitions(37);
export const allRequisitions = [...requisitions, ...generatedRequisitions];

export function getRequisition(prNumber: string): PurchaseRequisition | undefined {
  return allRequisitions.find((pr) => pr.prNumber === prNumber);
}
