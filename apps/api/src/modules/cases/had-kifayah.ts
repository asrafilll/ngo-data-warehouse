// Had Kifayah calculation (PRD §4, BAZNAS-style): household sufficiency threshold from
// the regional index, compared against real monthly income to produce a financial gap
// and an eligibility grade. Component weights are internal SIP policy approximating the
// BAZNAS parameter structure; the food component is scaled by the regional food index.
import type { RegionalIndex } from "@prisma/client";

export type HadKifayahResult = {
  region: string;
  province: string;
  familyMonthlyNeed: number;
  perCapitaNeed: number;
  actualMonthlyIncome: number;
  financialGap: number;
  recommendedAid: number;
  eligibility: "Sangat Layak" | "Layak" | "Perlu Review" | "Tidak Layak";
  components: Array<{ label: string; amount: number }>;
};

export function toMonthlyIncome(amount: number, period: string) {
  if (period === "per hari") return amount * 26;
  if (period === "per pekan") return amount * 4;
  return amount;
}

function roundTo(value: number, step: number) {
  return Math.round(value / step) * step;
}

export function calculateHadKifayah(input: {
  region: RegionalIndex | null;
  monthlyIncome: number;
  dependents: number;
  rentCost?: number | null;
}): HadKifayahResult {
  // No regional index configured for the mustahik's city: fall back to a national
  // baseline so the panel still renders, flagged via region label.
  const base = input.region?.familyMonthlyNeed ?? 4_500_000;
  const foodIndex = input.region?.foodIndex ?? 1;

  const dependentScale = Math.min(Math.max(input.dependents / 2, 0.5), 1.5);
  const components = [
    { label: "Makanan", amount: roundTo(base * 0.42 * foodIndex, 10_000) },
    { label: "Tempat tinggal", amount: input.rentCost || roundTo(base * 0.18, 10_000) },
    { label: "Pendidikan anak", amount: roundTo(base * 0.15 * dependentScale, 10_000) },
    { label: "Kesehatan", amount: roundTo(base * 0.13, 10_000) },
    { label: "Transportasi & ibadah", amount: roundTo(base * 0.12, 10_000) },
  ];

  const familyMonthlyNeed = components.reduce((sum, item) => sum + item.amount, 0);
  const financialGap = Math.max(0, familyMonthlyNeed - input.monthlyIncome);
  const recommendedAid = roundTo(financialGap, 50_000);
  const ratio = familyMonthlyNeed > 0 ? input.monthlyIncome / familyMonthlyNeed : 1;

  const eligibility =
    ratio < 0.4
      ? "Sangat Layak"
      : ratio < 0.65
        ? "Layak"
        : ratio < 0.85
          ? "Perlu Review"
          : "Tidak Layak";

  return {
    region: input.region?.city ?? "Baseline nasional",
    province: input.region?.province ?? "-",
    familyMonthlyNeed,
    perCapitaNeed: input.region?.perCapitaNeed ?? roundTo(base / 4, 10_000),
    actualMonthlyIncome: input.monthlyIncome,
    financialGap,
    recommendedAid,
    eligibility,
    components,
  };
}
