"use client";

import { useState } from "react";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Plan {
  id: string;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  credits: string;
  overage: string;
  features: string[];
  highlight?: boolean;
}

const BUILD_PLANS: Plan[] = [
  {
    id: "build-starter",
    name: "Starter",
    monthlyPrice: 99,
    annualPrice: 950,
    credits: "3 apps/month",
    overage: "$49/app",
    features: ["3 app builds/month", "Full source code", "Download as zip", "All templates", "Email support"],
  },
  {
    id: "build-builder",
    name: "Builder",
    monthlyPrice: 249,
    annualPrice: 2390,
    credits: "10 apps/month",
    overage: "$59/app",
    features: ["10 app builds/month", "Full source code", "Download as zip", "All templates", "Priority support"],
    highlight: true,
  },
  {
    id: "build-studio",
    name: "Studio",
    monthlyPrice: 499,
    annualPrice: 4790,
    credits: "25 apps/month",
    overage: "$69/app",
    features: ["25 app builds/month", "Full source code", "Download as zip", "All templates", "Priority support", "API access"],
  },
  {
    id: "build-agency",
    name: "Agency",
    monthlyPrice: 999,
    annualPrice: 9590,
    credits: "60 apps/month",
    overage: "$79/app",
    features: ["60 app builds/month", "Full source code", "White label output", "All templates", "Dedicated support", "API access"],
  },
];

const LAUNCH_PLANS: Plan[] = [
  {
    id: "launch-1",
    name: "Launch 1",
    monthlyPrice: 149,
    annualPrice: 1430,
    credits: "1 hosted app",
    overage: "$99/app/mo",
    features: ["1 hosted app", "SSL included", "Managed deploys", "Uptime monitoring", "Email support"],
  },
  {
    id: "launch-5",
    name: "Launch 5",
    monthlyPrice: 599,
    annualPrice: 5750,
    credits: "5 hosted apps",
    overage: "$109/app/mo",
    features: ["5 hosted apps", "SSL included", "Managed deploys", "Uptime monitoring", "Priority support"],
    highlight: true,
  },
  {
    id: "launch-15",
    name: "Launch 15",
    monthlyPrice: 1499,
    annualPrice: 14390,
    credits: "15 hosted apps",
    overage: "$119/app/mo",
    features: ["15 hosted apps", "SSL included", "Managed deploys", "Uptime monitoring", "Priority support", "Custom domains"],
  },
  {
    id: "launch-40",
    name: "Launch 40",
    monthlyPrice: 3499,
    annualPrice: 33590,
    credits: "40 hosted apps",
    overage: "$149/app/mo",
    features: ["40 hosted apps", "SSL included", "Managed deploys", "Uptime monitoring", "Dedicated support", "Custom domains", "SLA guarantee"],
  },
];

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);
  const [tab, setTab] = useState<"build" | "launch">("build");

  const plans = tab === "build" ? BUILD_PLANS : LAUNCH_PLANS;

  const handleSubscribe = async (planId: string) => {
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId, annual }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  };

  return (
    <>
      <Navbar />
      <main className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <h1 className="text-3xl font-bold sm:text-4xl">
              DeNovo doesn&apos;t charge for prompts.
              <br />
              <span className="bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
                It charges for launched businesses.
              </span>
            </h1>
          </div>

          {/* Product tabs */}
          <div className="mt-10 flex items-center justify-center gap-1 rounded-xl bg-secondary p-1">
            <button
              onClick={() => setTab("build")}
              className={cn(
                "flex-1 rounded-lg px-6 py-2.5 text-sm font-medium transition-colors max-w-xs",
                tab === "build" ? "bg-background text-foreground shadow" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div>Build</div>
              <div className="text-xs font-normal text-muted-foreground">Generate and take the code</div>
            </button>
            <button
              onClick={() => setTab("launch")}
              className={cn(
                "flex-1 rounded-lg px-6 py-2.5 text-sm font-medium transition-colors max-w-xs",
                tab === "launch" ? "bg-background text-foreground shadow" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div>Launch</div>
              <div className="text-xs font-normal text-muted-foreground">We host, maintain, and run it</div>
            </button>
          </div>

          {/* Billing toggle */}
          <div className="mt-8 flex items-center justify-center gap-3">
            <span className={cn("text-sm", !annual && "text-foreground font-medium")}>Monthly</span>
            <button
              onClick={() => setAnnual(!annual)}
              className={cn(
                "relative h-6 w-11 rounded-full transition-colors",
                annual ? "bg-primary" : "bg-border"
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform",
                  annual && "translate-x-5"
                )}
              />
            </button>
            <span className={cn("text-sm", annual && "text-foreground font-medium")}>
              Annual <span className="text-primary text-xs">(2 months free)</span>
            </span>
          </div>

          {/* Plans grid */}
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {plans.map((plan) => {
              const price = annual ? Math.round(plan.annualPrice / 12) : plan.monthlyPrice;
              return (
                <div
                  key={plan.id}
                  className={cn(
                    "rounded-xl border p-6 flex flex-col",
                    plan.highlight ? "border-primary bg-primary/5" : "border-border bg-card"
                  )}
                >
                  {plan.highlight && (
                    <span className="mb-3 inline-block w-fit rounded-full bg-primary/20 px-2.5 py-0.5 text-xs font-medium text-primary">
                      Best Value
                    </span>
                  )}
                  <h3 className="text-lg font-semibold">{plan.name}</h3>
                  <p className="mt-2">
                    <span className="text-3xl font-bold">${price.toLocaleString()}</span>
                    <span className="text-sm text-muted-foreground">/mo</span>
                  </p>
                  {annual && (
                    <p className="text-xs text-muted-foreground">${plan.annualPrice.toLocaleString()}/yr</p>
                  )}
                  <p className="mt-1 text-sm text-muted-foreground">{plan.credits}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Overage: {plan.overage}</p>
                  <ul className="mt-6 flex-1 space-y-2">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="text-primary">&#10003;</span> {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="mt-6 w-full"
                    variant={plan.highlight ? "default" : "outline"}
                    onClick={() => handleSubscribe(plan.id)}
                  >
                    Get Started
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </>
  );
}
