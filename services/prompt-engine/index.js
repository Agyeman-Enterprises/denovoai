/**
 * DeNovo Prompt Engine — Claude-powered
 * Replaces keyword-matching stub with real LLM intent extraction.
 */
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SPEC_PROMPT = `You are an expert product architect and UI designer. Analyze this app idea and return a comprehensive ProductSpec as JSON.

App idea: "{PROMPT}"

Return ONLY valid JSON (no markdown, no fences). Follow this schema exactly:

{
  "name": "AppName",
  "slug": "app-name",
  "displayName": "App Display Name",
  "tagline": "Short punchy tagline, max 8 words",
  "description": "2-3 sentences describing what this app does and for whom",
  "mode": "saas_dashboard",
  "primaryColor": "#hexcode (vibrant main brand color)",
  "primaryForeground": "#ffffff or #000000 (contrasting text color)",
  "secondaryColor": "#hexcode (lighter complementary color)",
  "accentColor": "#hexcode (accent/highlight)",
  "borderColor": "#e2e8f0",
  "backgroundColor": "#ffffff",
  "sidebarBg": "#f8fafc",
  "coreEntity": "singular lowercase noun (e.g. project, dog, listing)",
  "coreEntityPlural": "plural form",
  "coreEntityFields": [
    { "name": "title", "label": "Title", "type": "text", "required": true },
    { "name": "description", "label": "Description", "type": "textarea", "required": false },
    { "name": "status", "label": "Status", "type": "select", "options": ["active", "draft", "archived"], "required": false }
  ],
  "targetAudience": "one sentence describing who uses this",
  "screens": [
    { "id": "onboarding", "name": "Get Started", "description": "Welcome screen for new users, shows value prop and setup steps" },
    { "id": "dashboard", "name": "Dashboard", "description": "Main home with stats cards and recent activity feed" },
    { "id": "list", "name": "All Items", "description": "Searchable, filterable table/grid of the core entity" },
    { "id": "detail", "name": "Item Detail", "description": "View and edit a single item with all its fields" },
    { "id": "settings", "name": "Settings", "description": "Account preferences, profile, notifications" },
    { "id": "billing", "name": "Billing", "description": "Plan overview, usage stats, upgrade CTA" }
  ],
  "navItems": [
    { "label": "Dashboard", "href": "/dashboard", "icon": "LayoutDashboard" },
    { "label": "Items", "href": "/items", "icon": "List" },
    { "label": "Settings", "href": "/settings", "icon": "Settings" }
  ],
  "dbSchema": {
    "mainTable": "items",
    "sql": "CREATE TABLE IF NOT EXISTS items (\\n  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\\n  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,\\n  title TEXT NOT NULL,\\n  description TEXT,\\n  status TEXT DEFAULT 'active',\\n  created_at TIMESTAMPTZ DEFAULT NOW(),\\n  updated_at TIMESTAMPTZ DEFAULT NOW()\\n);\\n\\nALTER TABLE items ENABLE ROW LEVEL SECURITY;\\nCREATE POLICY \\"Users own their items\\" ON items\\n  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);"
  },
  "landingHero": {
    "headline": "Compelling headline, max 8 words",
    "subheadline": "Supporting text 1-2 sentences explaining the value proposition",
    "ctaText": "Get Started Free",
    "features": [
      { "icon": "Zap", "title": "Feature 1", "description": "Short benefit" },
      { "icon": "Shield", "title": "Feature 2", "description": "Short benefit" },
      { "icon": "Globe", "title": "Feature 3", "description": "Short benefit" },
      { "icon": "Sparkles", "title": "Feature 4", "description": "Short benefit" },
      { "icon": "Rocket", "title": "Feature 5", "description": "Short benefit" },
      { "icon": "Star", "title": "Feature 6", "description": "Short benefit" }
    ]
  },
  "pricingPlans": [
    { "name": "Free", "price": 0, "description": "Perfect to get started", "features": ["5 items/month", "Basic features", "Email support"], "cta": "Get Started" },
    { "name": "Pro", "price": 29, "description": "For power users", "features": ["Unlimited items", "All features", "Priority support", "Analytics"], "cta": "Upgrade to Pro", "popular": true }
  ]
}`

export async function interpretPrompt(prompt) {
  console.log('[prompt-engine] Calling Claude to interpret prompt...')

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    messages: [{
      role: 'user',
      content: SPEC_PROMPT.replace('{PROMPT}', prompt.replace(/"/g, '\\"'))
    }]
  })

  const text = response.content[0].text.trim()
  const clean = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim()
  const productSpec = JSON.parse(clean)

  console.log(`[prompt-engine] App: "${productSpec.displayName}" | Entity: ${productSpec.coreEntity}`)

  return {
    mode: productSpec.mode || 'saas_dashboard',
    features: ['auth', 'dashboard', 'crud', 'search', 'stripe_billing'],
    requested: [],
    productSpec,
    systemDesign: {
      architecture: 'next-app-router',
      database: 'supabase',
      auth: 'supabase-auth',
      payments: 'stripe',
      deployment: 'vercel'
    }
  }
}
