"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { hasRole, type Role } from "./roles";

export function useRole() {
  const [role, setRole] = useState<Role>("user");
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
        setRole((data?.role ?? "user") as Role);
      }
      setLoading(false);
    }
    load();
  }, [supabase]);

  return { role, loading, hasRole: (required: Role) => hasRole(role, required), isAdmin: role === "admin" };
}
