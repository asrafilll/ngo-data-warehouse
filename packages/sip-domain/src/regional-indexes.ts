import type { RegionalIndex } from "./types";

// Mock Had Kifayah regional reference data for the SIP admin prototype.
export const regionalIndexes: RegionalIndex[] = [
  {
    id: "reg-bks",
    province: "Jawa Barat",
    city: "Bekasi",
    familyMonthlyNeed: 4_820_000,
    perCapitaNeed: 1_205_000,
    foodIndex: 1.08,
    updatedAt: "2026-06-12",
  },
  {
    id: "reg-bgr",
    province: "Jawa Barat",
    city: "Bogor",
    familyMonthlyNeed: 4_360_000,
    perCapitaNeed: 1_090_000,
    foodIndex: 1.02,
    updatedAt: "2026-06-12",
  },
  {
    id: "reg-jkt",
    province: "DKI Jakarta",
    city: "Jakarta Timur",
    familyMonthlyNeed: 5_480_000,
    perCapitaNeed: 1_370_000,
    foodIndex: 1.22,
    updatedAt: "2026-06-14",
  },
  {
    id: "reg-tng",
    province: "Banten",
    city: "Tangerang Selatan",
    familyMonthlyNeed: 5_120_000,
    perCapitaNeed: 1_280_000,
    foodIndex: 1.14,
    updatedAt: "2026-06-14",
  },
];
