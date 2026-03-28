import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { hasRole, type Role } from "./roles";

export async function requireRole(requiredRole: Role, redirectTo = "/dashboard") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const userRole = (profile?.role ?? "user") as Role;

  if (!hasRole(userRole, requiredRole)) redirect(redirectTo);

  return { user, role: userRole };
}

export async function requireAuth() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");
  return user;
}
