// Combined types: pipeline-internal + domain types (inlined from @autonomous-product-studio/domain)

// ── Domain types ──────────────────────────────────────────────────────────────

export type TrawlSourceDomain = string;

export type TrawlSourceType =
  | 'landing-page' | 'mobile-screen' | 'design-shot' | 'brand-page';

export type LayoutPatternId =
  | 'hero-minimal' | 'hero-features' | 'saas-landing-full' | 'marketing-hub'
  | 'editorial-article' | 'editorial-index'
  | 'dashboard-app' | 'docs-sidebar'
  | 'e-commerce-catalog' | 'e-commerce-pdp'
  | 'portfolio-grid' | 'portfolio-case-study'
  | 'form-auth' | 'form-onboarding' | 'pricing-page'
  | 'about-brand' | 'contact-page'
  | 'mobile-app-screen' | 'error-page'
  | 'split-hero' | 'fullbleed-hero' | 'text-hero'
  | 'alternating-rows' | 'icon-feature-grid'
  | 'testimonial-wall' | 'bento-section'
  | (string & {});

export interface PaletteEntry {
  hex: string;
  role: 'primary' | 'secondary' | 'accent' | 'background' | 'text' | 'other';
  frequency: number;
}

export interface FontEntry {
  family: string;
  weight: number;
  role: 'heading' | 'body' | 'mono' | 'display' | 'other';
  size?: string;
  tracking?: string;
  leading?: string;
  pairing?: string;
}

export interface SpacingData {
  border_radii: string[];
  radius_philosophy: 'sharp' | 'subtle' | 'rounded' | 'pill' | 'mixed';
  shadows: string[];
  shadow_philosophy: 'flat' | 'soft' | 'hard' | 'layered' | 'none';
  spacing_scale: number[];
  tokens: Record<string, string>;
  has_blur: boolean;
  whitespace_philosophy: 'airy' | 'comfortable' | 'dense';
}

export interface TrawlSource {
  id: string;
  source_url: string;
  source_domain: TrawlSourceDomain;
  source_type: TrawlSourceType;
  palette: PaletteEntry[];
  fonts: FontEntry[];
  layout_type?: string;
  layout_freeform?: string;
  layout_pattern_id?: LayoutPatternId;
  layout_data?: Record<string, unknown>;
  vibe_tags: string[];
  archetype?: string;
  spacing_data?: SpacingData;
  source_hub?: string;
  captured_at: string;
  captured_by?: string;
  primary_color_hex?: string;
  primary_font_family?: string;
  metadata_completeness: number;
  created_at: string;
  updated_at: string;
}

export type TrawlSourceInsert = Omit<TrawlSource, 'id' | 'created_at' | 'updated_at'>;

export interface TrawlScreenshot {
  id: string;
  source_id: string;
  aenio_bucket: string;
  aenio_path: string;
  aenio_size_bytes?: number;
  perceptual_hash: string;
  width_px?: number;
  height_px?: number;
  viewport?: string;
  captured_at: string;
  created_at: string;
}

export type TrawlScreenshotInsert = Omit<TrawlScreenshot, 'id' | 'created_at'>;

export interface DesignTokens {
  colors: Record<string, string>;
  typography: Record<string, { fontFamily: string; fontSize?: string; fontWeight?: string; lineHeight?: string }>;
  spacing: Record<string, string>;
  radii: Record<string, string>;
  shadows: Record<string, string>;
}

export interface ProductSpec {
  domain: 'healthcare' | 'saas' | 'ecommerce' | 'analytics' | 'crm' | 'education' | 'general';
  brandIntent: 'minimal' | 'modern' | 'bold' | 'premium' | 'playful';
}

// ── Pipeline-internal types ───────────────────────────────────────────────────

export interface TrawlRequest {
  urls: string[];
  viewport: 'desktop-1440' | 'mobile-375' | 'tablet-768';
  capture_screenshot: boolean;
  options?: {
    timeout_ms?: number;
    user_agent?: string;
    wait_for_selector?: string;
  };
}

export interface TrawlResult {
  url: string;
  status: 'SUCCESS' | 'FAILED' | 'SKIPPED';
  source_id?: string;
  screenshot_id?: string;
  metadata_completeness: number;
  error?: string;
  duration_ms: number;
}

export interface SourceConfig {
  type: TrawlSourceType;
  wait_for_selector?: string;
  rate_limit_ms: number;
  user_agent_override?: string;
  source_hub?: string;
}

export interface PaletteExtracted {
  hex: string;
  role: 'primary' | 'secondary' | 'accent' | 'background' | 'text' | 'other';
  frequency: number;
}

export interface FontExtracted {
  family: string;
  weight: number;
  role: 'heading' | 'body' | 'mono' | 'display' | 'other';
  size?: string;
  tracking?: string;
  leading?: string;
  pairing?: string;
}

export interface SpacingExtracted {
  border_radii: string[];
  radius_philosophy: 'sharp' | 'subtle' | 'rounded' | 'pill' | 'mixed';
  shadows: string[];
  shadow_philosophy: 'flat' | 'soft' | 'hard' | 'layered' | 'none';
  spacing_scale: number[];
  tokens: Record<string, string>;
  has_blur: boolean;
  whitespace_philosophy: 'airy' | 'comfortable' | 'dense';
}
