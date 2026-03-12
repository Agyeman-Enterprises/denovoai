/**
 * DeNovo Code Generator — Claude-powered
 * Generates all app screens with beautiful, consistent design.
 *
 * Each screen uses CSS variables for brand colors so the full UI
 * is theme-consistent (banani.co style).
 */
import Anthropic from '@anthropic-ai/sdk'
import fs from 'node:fs'
import path from 'node:path'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ── Shared design system context injected into every screen prompt ──────────

function designContext(spec) {
  return `
DESIGN SYSTEM:
- Use Tailwind CSS classes ONLY (no external UI library imports needed)
- Brand colors are available as CSS variables:
  --primary: ${spec.primaryColor}
  --primary-fg: ${spec.primaryForeground}
  --secondary: ${spec.secondaryColor}
  --accent: ${spec.accentColor}
  --sidebar-bg: ${spec.sidebarBg}
- Use these via style={{ background: 'var(--primary)', color: 'var(--primary-fg)' }}
- For Tailwind bg/text you can use inline styles for brand colors
- Default to clean white cards, subtle gray borders (#e2e8f0), proper spacing
- Typography: font-semibold for headings, text-slate-600 for body, text-slate-400 for muted
- Use rounded-xl for cards, rounded-lg for inputs/buttons
- Shadows: shadow-sm for cards
- All screens use the same sidebar layout (imported from '@/components/app/sidebar')
- Icons: import from 'lucide-react'

APP CONTEXT:
- App name: ${spec.displayName}
- Tagline: ${spec.tagline}
- Core entity: ${spec.coreEntity} (plural: ${spec.coreEntityPlural})
- Fields: ${JSON.stringify(spec.coreEntityFields)}
- Nav items: ${JSON.stringify(spec.navItems)}
- Primary color: ${spec.primaryColor}

CRITICAL RULES:
1. Return ONLY the TypeScript/TSX file content, no markdown fences
2. Use 'use client' directive for interactive components
3. Import lucide-react icons as named imports: import { IconName } from 'lucide-react'
4. All data fetching uses the Supabase client from '@/lib/supabase/client'
5. Table name for the core entity is: ${spec.dbSchema?.mainTable || 'items'}
6. Make every screen look production-quality and beautiful — like a real $50/mo SaaS product
7. Include loading states, empty states, and error handling
8. Use the brand primaryColor for all CTAs, active states, highlights`
}

// ── Screen generators ────────────────────────────────────────────────────

async function generateScreen(screenId, userPrompt, spec) {
  console.log(`[codegen] Generating screen: ${screenId}...`)
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 16000,
    messages: [{ role: 'user', content: userPrompt }]
  })
  const text = response.content[0].text.trim()
  return text.replace(/^```(tsx?|jsx?)?\n?/, '').replace(/\n?```$/, '').trim()
}

async function generateLandingPage(spec) {
  const prompt = `${designContext(spec)}

Generate a stunning, complete Next.js landing page for "${spec.displayName}".

The landing page must include:
1. NAVBAR: Logo (app name), nav links (Features, Pricing, Sign in), and a CTA button styled with var(--primary)
2. HERO: Full-width section with gradient background using primaryColor, large headline "${spec.landingHero.headline}", subheadline, two CTA buttons (primary + secondary)
3. FEATURES GRID: 6 feature cards in a 3-column grid:
${spec.landingHero.features.map(f => `   - ${f.title}: ${f.description}`).join('\n')}
4. PRICING: Two cards side by side (Free and Pro), Pro card highlighted with primary color border
   Free plan: ${JSON.stringify(spec.pricingPlans[0])}
   Pro plan: ${JSON.stringify(spec.pricingPlans[1])}
5. TESTIMONIALS: 3 fake but realistic testimonials with avatar initials
6. CTA SECTION: Bottom CTA with gradient background
7. FOOTER: Import and render the Footer component: import Footer from '@/components/app/footer'
   Place <Footer /> at the very bottom of the page, after all sections.

Use inline styles for the brand gradient: background: 'linear-gradient(135deg, ${spec.primaryColor}dd 0%, ${spec.accentColor}bb 100%)'

This is the app's public marketing page. Make it look like Stripe/Linear/Vercel quality.
File path will be: app/page.tsx`

  return generateScreen('landing', prompt, spec)
}

async function generateDashboard(spec) {
  const prompt = `${designContext(spec)}

Generate the Dashboard page for "${spec.displayName}".

This page is at app/(app)/dashboard/page.tsx and shows:
1. PAGE HEADER: "Good morning, [username]" + date, with a "New ${spec.coreEntity}" button
2. STATS ROW: 4 stat cards showing:
   - Total ${spec.coreEntityPlural} (fetched from Supabase count)
   - Active this month
   - Growth % (fake but realistic)
   - One domain-specific stat
3. RECENT ACTIVITY: Table showing the 5 most recent ${spec.coreEntityPlural} with status badges
4. QUICK ACTIONS: 2-3 action cards relevant to the app domain
5. EMPTY STATE: Show a helpful onboarding card when there are no items yet

Use Supabase to fetch real data:
\`\`\`
import { createClient } from '@/lib/supabase/client'
\`\`\`
Query the '${spec.dbSchema?.mainTable || 'items'}' table.
Use useEffect + useState for data fetching (this is a client component).
Show a skeleton loading state while data loads.

Make the stats cards beautiful with subtle colored icons using var(--primary).`

  return generateScreen('dashboard', prompt, spec)
}

async function generateListPage(spec) {
  const prompt = `${designContext(spec)}

Generate the ${spec.coreEntityPlural} list page for "${spec.displayName}".
File path: app/(app)/items/page.tsx

This page shows ALL ${spec.coreEntityPlural} with:
1. HEADER: Title "All ${spec.coreEntityPlural}" + item count badge + "New ${spec.coreEntity}" button (styled with var(--primary))
2. TOOLBAR: Search input (filter by title), status filter tabs (All / Active / Draft / Archived)
3. TABLE: Clean data table with columns:
   - ${spec.coreEntityFields.map(f => f.label).join(', ')}, Created, Actions
   - Row actions: Edit (pencil icon), Delete (trash icon with confirm)
   - Checkboxes for bulk selection
4. PAGINATION: Simple prev/next with item count
5. EMPTY STATE: Beautiful empty state with icon and "Create your first ${spec.coreEntity}" CTA
6. CREATE/EDIT DIALOG: Modal dialog with a form for all fields:
${spec.coreEntityFields.map(f => `   - ${f.label} (${f.type}${f.options ? ', options: ' + f.options.join('/') : ''})`).join('\n')}

Fetch from Supabase table '${spec.dbSchema?.mainTable || 'items'}'.
Include create, update, and delete operations.
All mutations refresh the list.`

  return generateScreen('list', prompt, spec)
}

async function generateSettingsPage(spec) {
  const prompt = `${designContext(spec)}

Generate the Settings page for "${spec.displayName}".
File path: app/(app)/settings/page.tsx

Include tabbed sections:
1. PROFILE TAB: Edit name, email display, avatar (initials-based circle)
2. NOTIFICATIONS TAB: Toggle switches for email notifications, weekly digest, product updates
3. APPEARANCE TAB: Theme toggle (light/dark placeholder), density setting
4. DANGER ZONE TAB: Delete account (with confirmation dialog)

Use a vertical tab layout on the left with content on the right.
Make the profile save button use var(--primary).
Show success toast after saving.

Import Supabase client, get user from auth.getUser(), allow profile updates.`

  return generateScreen('settings', prompt, spec)
}

async function generateBillingPage(spec) {
  const prompt = `${designContext(spec)}

Generate the Billing page for "${spec.displayName}".
File path: app/(app)/billing/page.tsx

Include:
1. CURRENT PLAN: Card showing plan name (Free/Pro), billing period, next renewal date
2. USAGE: Progress bar showing items used / limit (e.g. 3/5 for free tier)
3. UPGRADE CARD: Featured Pro plan card with:
   - Price: $29/month
   - Feature list: ${JSON.stringify(spec.pricingPlans[1]?.features || [])}
   - "Upgrade to Pro" button that calls /api/checkout (styled with var(--primary))
4. BILLING HISTORY: Empty state or placeholder table for invoices
5. CANCEL/MANAGE: Link to manage subscription

Fetch subscription data from /api/subscription endpoint.
Show different UI for free vs pro users.`

  return generateScreen('billing', prompt, spec)
}

async function generateOnboardingPage(spec) {
  const prompt = `${designContext(spec)}

Generate the Onboarding/Welcome page for "${spec.displayName}".
File path: app/(app)/onboarding/page.tsx

Create a beautiful multi-step onboarding flow:
1. STEP 1 - WELCOME: Big welcome message, app logo/icon, "What you can do" list of 3 key benefits
2. STEP 2 - PROFILE SETUP: Name input, optional avatar setup, "This helps us personalize your experience"
3. STEP 3 - CREATE FIRST ITEM: Simplified form to create their first ${spec.coreEntity}
   Fields: ${spec.coreEntityFields.filter(f => f.required).map(f => f.label).join(', ')}
4. STEP 4 - DONE: Celebration screen with confetti emoji, link to dashboard

Use a step indicator at the top (circles with lines connecting them).
Color the active step with var(--primary).
"Next" and "Back" buttons on each step.
"Skip for now" link on step 2-3.
On completion, redirect to /dashboard.`

  return generateScreen('onboarding', prompt, spec)
}

async function generateFooter(spec) {
  const prompt = `${designContext(spec)}

Generate a production-quality Footer component for "${spec.displayName}".
File path: components/app/footer.tsx

This footer is used on the public-facing landing page. Make it look like Stripe/Linear quality.

Requirements:
1. BRAND COLUMN (left): App logo (colored square + name), tagline "${spec.tagline}", brief description (1 sentence).
   Add social icon links (Twitter/X, LinkedIn, GitHub) as icon-only buttons.
2. PRODUCT COLUMN: Links relevant to this specific app:
   - Features, Pricing, Changelog, Roadmap
3. COMPANY COLUMN: About, Blog, Careers, Press
4. LEGAL COLUMN: Privacy Policy, Terms of Service, Cookie Policy, Security
5. BOTTOM BAR: Copyright "© ${new Date().getFullYear()} ${spec.displayName}. All rights reserved." + "Made with ♥" tagline
   Use a subtle top border to separate from the columns.

Design rules:
- Background: dark (#0f172a or similar near-black)
- Text: slate-400 for links, white for headings and brand name
- Brand color var(--primary) for logo background and hover states on links
- Column headings: uppercase, tracking-wider, text-xs, text-slate-500
- Links: text-slate-400 hover:text-white transition-colors text-sm
- 4-column grid on desktop, 2-column on tablet, 1-column on mobile
- Full width, generous padding (py-16 px-8)

Export as: export default function Footer()
This is a React client component ('use client').`

  return generateScreen('footer', prompt, spec)
}

async function generateSidebar(spec) {
  const prompt = `${designContext(spec)}

Generate the Sidebar navigation component for "${spec.displayName}".
File path: components/app/sidebar.tsx

This is a fixed left sidebar used in the app layout:
1. LOGO: App name "${spec.displayName}" with a colored square icon using var(--primary)
2. NAV ITEMS:
${spec.navItems.map(n => `   - ${n.label} → ${n.href} (icon: ${n.icon})`).join('\n')}
   - Billing → /billing (icon: CreditCard)
3. ACTIVE STATE: Active nav item has background using a light tint of primaryColor
4. USER SECTION at bottom: Avatar (initials), user email, sign out button

Style the sidebar with background: var(--sidebar-bg), right border.
Width: 240px fixed.
Use Next.js Link for navigation, usePathname() for active state detection.
Make it responsive (collapses on mobile with a hamburger toggle).`

  return generateScreen('sidebar', prompt, spec)
}

// ── Main export ──────────────────────────────────────────────────────────

export async function generateAllScreens(workspaceDir, productSpec) {
  console.log('[codegen] Generating all screens with Claude...')

  const appDir = path.join(workspaceDir, 'app')
  const componentsDir = path.join(workspaceDir, 'components', 'app')
  fs.mkdirSync(path.join(appDir, '(app)', 'dashboard'), { recursive: true })
  fs.mkdirSync(path.join(appDir, '(app)', 'items'), { recursive: true })
  fs.mkdirSync(path.join(appDir, '(app)', 'settings'), { recursive: true })
  fs.mkdirSync(path.join(appDir, '(app)', 'billing'), { recursive: true })
  fs.mkdirSync(path.join(appDir, '(app)', 'onboarding'), { recursive: true })
  fs.mkdirSync(componentsDir, { recursive: true })

  // Generate all screens in parallel
  const [landing, dashboard, list, settings, billing, onboarding, sidebar, footer] = await Promise.all([
    generateLandingPage(productSpec),
    generateDashboard(productSpec),
    generateListPage(productSpec),
    generateSettingsPage(productSpec),
    generateBillingPage(productSpec),
    generateOnboardingPage(productSpec),
    generateSidebar(productSpec),
    generateFooter(productSpec),
  ])

  // Write all files
  fs.writeFileSync(path.join(appDir, 'page.tsx'), landing)
  fs.writeFileSync(path.join(appDir, '(app)', 'dashboard', 'page.tsx'), dashboard)
  fs.writeFileSync(path.join(appDir, '(app)', 'items', 'page.tsx'), list)
  fs.writeFileSync(path.join(appDir, '(app)', 'settings', 'page.tsx'), settings)
  fs.writeFileSync(path.join(appDir, '(app)', 'billing', 'page.tsx'), billing)
  fs.writeFileSync(path.join(appDir, '(app)', 'onboarding', 'page.tsx'), onboarding)
  fs.writeFileSync(path.join(componentsDir, 'sidebar.tsx'), sidebar)
  fs.writeFileSync(path.join(componentsDir, 'footer.tsx'), footer)

  console.log('[codegen] All 8 screens generated ✓')

  return {
    screens: ['landing', 'dashboard', 'list', 'settings', 'billing', 'onboarding', 'sidebar', 'footer'],
  }
}
