"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SlotMap } from "@/types/denovo";

export default function ConfirmPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId as string;
  const supabase = createClient();
  const [slots, setSlots] = useState<Partial<SlotMap> | null>(null);
  const [loading, setLoading] = useState(true);
  const [assembling, setAssembling] = useState(false);

  useEffect(() => {
    async function loadSession() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }

      const { data: session } = await supabase
        .from("sessions")
        .select("slot_map")
        .eq("id", sessionId)
        .single();

      if (session?.slot_map) {
        setSlots(session.slot_map as Partial<SlotMap>);
      }
      setLoading(false);
    }
    loadSession();
  }, [sessionId, supabase, router]);

  const handleBuild = async (outputType: "deploy" | "download") => {
    setAssembling(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Create app record
    const slug = (slots?.APP_NAME || "app").toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const { data: app } = await supabase
      .from("apps")
      .insert({
        user_id: user.id,
        name: slots?.APP_NAME || "Untitled App",
        slug,
        template: slots?.TEMPLATE || "saas",
        slot_map: slots || {},
        snippets: slots?.SNIPPETS || [],
        output_type: outputType,
      })
      .select()
      .single();

    if (!app) { setAssembling(false); return; }

    // Link session to app
    await supabase
      .from("sessions")
      .update({ app_id: app.id, stage: "assembling" })
      .eq("id", sessionId);

    // Trigger assembly
    const res = await fetch("/api/denovo/assemble", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, appId: app.id, outputType }),
    });

    const data = await res.json();
    if (data.jobId) {
      router.push(`/studio/${sessionId}?jobId=${data.jobId}&appId=${app.id}`);
    } else {
      setAssembling(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground">Loading confirmation...</p>
        </div>
      </>
    );
  }

  if (!slots) {
    return (
      <>
        <Navbar />
        <div className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground">Session not found.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <Card className="w-full max-w-lg">
          <h2 className="text-xl font-bold">Here&apos;s what DeNovo will build</h2>

          <div className="mt-6 space-y-3">
            <Row label="Name" value={slots.APP_NAME || "—"} />
            <Row label="Type" value={slots.TEMPLATE || "—"}>
              <Badge>{slots.TEMPLATE}</Badge>
            </Row>
            {slots.SELLER_NOUN && <Row label="Sellers" value={slots.SELLER_NOUN} />}
            {slots.BUYER_NOUN && <Row label="Buyers" value={slots.BUYER_NOUN} />}
            {slots.LISTING_NOUN && <Row label="Listing type" value={slots.LISTING_NOUN} />}
            {slots.CATEGORIES && slots.CATEGORIES.length > 0 && (
              <Row label="Categories" value={slots.CATEGORIES.join(", ")} />
            )}
            {slots.PLATFORM_FEE_PERCENT && (
              <Row label="Platform fee" value={`${slots.PLATFORM_FEE_PERCENT}%`} />
            )}
            {slots.SNIPPETS && slots.SNIPPETS.length > 0 && (
              <div className="flex items-start gap-3 py-2">
                <span className="w-28 shrink-0 text-sm text-muted-foreground">Features</span>
                <div className="flex flex-wrap gap-1.5">
                  {slots.SNIPPETS.map((s) => (
                    <Badge key={s} variant="secondary">{s}</Badge>
                  ))}
                </div>
              </div>
            )}
            {slots.SCHEMA_EXTRAS && slots.SCHEMA_EXTRAS.length > 0 && (
              <div className="flex items-start gap-3 py-2">
                <span className="w-28 shrink-0 text-sm text-muted-foreground">AI extras</span>
                <div className="space-y-1">
                  {slots.SCHEMA_EXTRAS.map((e) => (
                    <p key={e} className="text-sm">+ {e}</p>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 flex flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => router.push(`/studio?resume=${sessionId}`)}
              disabled={assembling}
            >
              Edit anything
            </Button>
            <Button
              className="flex-1"
              onClick={() => handleBuild("deploy")}
              disabled={assembling}
            >
              {assembling ? "Starting..." : "Deploy it"}
            </Button>
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => handleBuild("download")}
              disabled={assembling}
            >
              Download instead
            </Button>
          </div>
        </Card>
      </main>
    </>
  );
}

function Row({ label, value, children }: { label: string; value: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-border last:border-0">
      <span className="w-28 shrink-0 text-sm text-muted-foreground">{label}</span>
      {children || <span className="text-sm font-medium">{value}</span>}
    </div>
  );
}
