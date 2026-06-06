"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function DeleteAppButton({ appId }: { appId: string }) {
  const router = useRouter();
  const onDelete = async () => {
    if (!confirm("Delete this app? This cannot be undone.")) return;
    await fetch(`/api/apps/${appId}`, { method: "DELETE" });
    router.push("/dashboard");
  };
  return (
    <Button variant="destructive" size="sm" onClick={onDelete}>Delete App</Button>
  );
}
