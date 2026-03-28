export const OVERAGE_PRICE_MAP: Record<string, string> = {
  "build-starter": process.env.STRIPE_OVERAGE_BUILD_STARTER_PRICE_ID || "",
  "build-builder": process.env.STRIPE_OVERAGE_BUILD_BUILDER_PRICE_ID || "",
  "build-studio": process.env.STRIPE_OVERAGE_BUILD_STUDIO_PRICE_ID || "",
  "build-agency": process.env.STRIPE_OVERAGE_BUILD_AGENCY_PRICE_ID || "",
  "launch-1": process.env.STRIPE_OVERAGE_LAUNCH_1_PRICE_ID || "",
  "launch-5": process.env.STRIPE_OVERAGE_LAUNCH_5_PRICE_ID || "",
  "launch-15": process.env.STRIPE_OVERAGE_LAUNCH_15_PRICE_ID || "",
  "launch-40": process.env.STRIPE_OVERAGE_LAUNCH_40_PRICE_ID || "",
};

export const PLAN_PRICE_ENV_MAP: Record<string, { monthly: string; annual: string }> = {
  "build-starter": {
    monthly: "STRIPE_BUILD_STARTER_MONTHLY_PRICE_ID",
    annual: "STRIPE_BUILD_STARTER_ANNUAL_PRICE_ID",
  },
  "build-builder": {
    monthly: "STRIPE_BUILD_BUILDER_MONTHLY_PRICE_ID",
    annual: "STRIPE_BUILD_BUILDER_ANNUAL_PRICE_ID",
  },
  "build-studio": {
    monthly: "STRIPE_BUILD_STUDIO_MONTHLY_PRICE_ID",
    annual: "STRIPE_BUILD_STUDIO_ANNUAL_PRICE_ID",
  },
  "build-agency": {
    monthly: "STRIPE_BUILD_AGENCY_MONTHLY_PRICE_ID",
    annual: "STRIPE_BUILD_AGENCY_ANNUAL_PRICE_ID",
  },
  "launch-1": {
    monthly: "STRIPE_LAUNCH_1_MONTHLY_PRICE_ID",
    annual: "STRIPE_LAUNCH_1_ANNUAL_PRICE_ID",
  },
  "launch-5": {
    monthly: "STRIPE_LAUNCH_5_MONTHLY_PRICE_ID",
    annual: "STRIPE_LAUNCH_5_ANNUAL_PRICE_ID",
  },
  "launch-15": {
    monthly: "STRIPE_LAUNCH_15_MONTHLY_PRICE_ID",
    annual: "STRIPE_LAUNCH_15_ANNUAL_PRICE_ID",
  },
  "launch-40": {
    monthly: "STRIPE_LAUNCH_40_MONTHLY_PRICE_ID",
    annual: "STRIPE_LAUNCH_40_ANNUAL_PRICE_ID",
  },
};

export function getPriceIdForPlan(planId: string, annual: boolean): string | null {
  const map = PLAN_PRICE_ENV_MAP[planId];
  if (!map) return null;
  const envKey = annual ? map.annual : map.monthly;
  return process.env[envKey] || null;
}
