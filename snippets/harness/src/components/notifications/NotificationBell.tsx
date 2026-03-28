"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function NotificationBell() {
  const [count, setCount] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { count: c } = await supabase.from("notifications").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("read", false);
      setCount(c || 0);
    }
    load();
  }, [supabase]);

  return (
    <div className="relative">
      <span className="text-white/60">&#128276;</span>
      {count > 0 && (
        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">{count}</span>
      )}
    </div>
  );
}
