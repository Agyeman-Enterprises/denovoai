import type { TemplateType } from "./database";

export interface SlotMap {
  APP_NAME: string;
  TAGLINE: string;
  HERO_COPY: string;
  TEMPLATE: TemplateType;
  SELLER_NOUN?: string;
  BUYER_NOUN?: string;
  LISTING_NOUN?: string;
  CATEGORIES: string[];
  PLATFORM_FEE_PERCENT?: number;
  PRIMARY_COLOR: string;
  SECONDARY_COLOR?: string;
  SCHEMA_EXTRAS: string[];
  SNIPPETS: string[];
}

export interface ParseRequest {
  sessionId: string;
  message: string;
}

export interface ParseResponse {
  message: string;
  stage: "clarifying" | "confirming" | "ready";
  slots?: Partial<SlotMap>;
  confirmationCard?: ConfirmationCard;
}

export interface ConfirmationCard {
  appName: string;
  template: TemplateType;
  tagline: string;
  categories: string[];
  snippets: string[];
  extras: string[];
  sellerNoun?: string;
  buyerNoun?: string;
  listingNoun?: string;
  platformFee?: number;
  primaryColor: string;
}

export interface AssembleRequest {
  sessionId: string;
  appId: string;
  outputType: "deploy" | "download";
}

export interface AssembleResponse {
  jobId: string;
  estimatedSeconds: number;
}

export interface JobStatus {
  stage: "cloning" | "substituting" | "injecting" | "schema" | "outputting" | "done" | "error";
  progress: number;
  log: string[];
  result?: {
    type: "deploy" | "download";
    giteaUrl?: string;
    coolifyAppId?: string;
    domain?: string;
    downloadUrl?: string;
  };
  error?: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export const TEMPLATE_INFO: Record<TemplateType, { label: string; description: string; icon: string }> = {
  marketplace: { label: "Marketplace", description: "Two-sided marketplace connecting buyers and sellers", icon: "Store" },
  saas: { label: "SaaS", description: "Software-as-a-service with user accounts and subscriptions", icon: "Cloud" },
  directory: { label: "Directory", description: "Searchable listing directory with categories", icon: "BookOpen" },
  community: { label: "Community", description: "Community platform with discussions and profiles", icon: "Users" },
  ecommerce: { label: "E-Commerce", description: "Online store with products and checkout", icon: "ShoppingCart" },
  "client-portal": { label: "Client Portal", description: "Client-facing portal with project management", icon: "Briefcase" },
  "internal-tool": { label: "Internal Tool", description: "Internal operations tool with dashboards", icon: "Settings" },
  "content-media": { label: "Content & Media", description: "Content publishing platform with media support", icon: "Newspaper" },
};
