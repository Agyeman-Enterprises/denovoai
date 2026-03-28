import { cn } from "@/lib/utils";

interface BadgeProps {
  variant?: "default" | "secondary" | "success" | "warning" | "destructive";
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = "default", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        {
          "bg-primary/20 text-primary": variant === "default",
          "bg-secondary text-secondary-foreground": variant === "secondary",
          "bg-green-500/20 text-green-400": variant === "success",
          "bg-yellow-500/20 text-yellow-400": variant === "warning",
          "bg-destructive/20 text-red-400": variant === "destructive",
        },
        className
      )}
    >
      {children}
    </span>
  );
}
