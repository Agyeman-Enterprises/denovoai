export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type AppStatus = "parsing" | "confirming" | "assembling" | "deploying" | "live" | "failed" | "downloaded";
export type SessionStage = "intake" | "clarifying" | "confirming" | "assembling" | "done";
export type JobStage = "cloning" | "substituting" | "injecting" | "schema" | "outputting" | "done" | "error";
export type PlanId = "build-starter" | "build-builder" | "build-studio" | "build-agency" | "launch-1" | "launch-5" | "launch-15" | "launch-40";
export type ProductType = "build" | "launch";
export type SubStatus = "active" | "cancelled" | "past_due" | "trialing";
export type OutputType = "deploy" | "download";
export type UserRole = "user" | "admin";
export type TemplateType = "marketplace" | "saas" | "directory" | "community" | "ecommerce" | "client-portal" | "internal-tool" | "content-media";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          role: UserRole;
          created_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      plans: {
        Row: {
          id: PlanId;
          name: string;
          monthly_credits: number;
          stripe_price_id: string | null;
          stripe_price_id_annual: string | null;
          price_monthly_cents: number | null;
          price_annual_cents: number | null;
          features: Json;
          created_at: string;
        };
        Insert: {
          id: PlanId;
          name: string;
          monthly_credits: number;
          stripe_price_id?: string | null;
          stripe_price_id_annual?: string | null;
          price_monthly_cents?: number | null;
          price_annual_cents?: number | null;
          features?: Json;
        };
        Update: Partial<Database["public"]["Tables"]["plans"]["Insert"]>;
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan_id: PlanId;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          status: SubStatus;
          credits_remaining: number;
          current_period_end: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan_id?: PlanId;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          status?: SubStatus;
          credits_remaining?: number;
          current_period_end?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["subscriptions"]["Insert"]>;
      };
      credit_purchases: {
        Row: {
          id: string;
          user_id: string;
          credits: number;
          amount_cents: number;
          stripe_payment_intent_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          credits: number;
          amount_cents: number;
          stripe_payment_intent_id?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["credit_purchases"]["Insert"]>;
      };
      apps: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          slug: string;
          template: string;
          status: AppStatus;
          slot_map: Json;
          snippets: string[];
          output_type: OutputType | null;
          gitea_repo_url: string | null;
          coolify_app_id: string | null;
          coolify_domain: string | null;
          download_url: string | null;
          download_expires_at: string | null;
          error_message: string | null;
          credits_used: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          slug: string;
          template: string;
          status?: AppStatus;
          slot_map?: Json;
          snippets?: string[];
          output_type?: OutputType | null;
          gitea_repo_url?: string | null;
          coolify_app_id?: string | null;
          coolify_domain?: string | null;
          download_url?: string | null;
          download_expires_at?: string | null;
          error_message?: string | null;
          credits_used?: number;
        };
        Update: Partial<Database["public"]["Tables"]["apps"]["Insert"]>;
      };
      sessions: {
        Row: {
          id: string;
          user_id: string;
          app_id: string | null;
          messages: Json;
          slot_map: Json;
          stage: SessionStage;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          app_id?: string | null;
          messages?: Json;
          slot_map?: Json;
          stage?: SessionStage;
        };
        Update: Partial<Database["public"]["Tables"]["sessions"]["Insert"]>;
      };
      assemble_jobs: {
        Row: {
          id: string;
          app_id: string;
          stage: JobStage;
          progress: number;
          log: string[] | null;
          result: Json | null;
          error: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          app_id: string;
          stage?: JobStage;
          progress?: number;
          log?: string[] | null;
          result?: Json | null;
          error?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["assemble_jobs"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
