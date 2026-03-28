# DeNovo — Template Registry & Slot Maps
## Authoritative source. 26 templates across 8 archetypes.
## Version 2.0 — aligned with canonical token schema and snippet numbering.

---

## Snippet Number Reference

| # | Snippet Name |
|---|---|
| 01 | Auth |
| 02 | Stripe Simple |
| 03 | Stripe Connect |
| 04 | File Upload |
| 05 | Admin Panel |
| 06 | Search & Filter |
| 07 | Output & Delivery |
| 08 | Roles & Permissions |
| 09 | Notifications |
| 10 | Messaging |
| 11 | Reviews & Ratings |
| 12 | Bookings |
| 13 | Blog / CMS |
| 14 | API + Webhooks |
| 15 | Email Transactional |

---

## Canonical Token Schema (shared across all templates)

```
{{APP_NAME}}          Display name of the app
{{APP_SLUG}}          URL-safe lowercase slug
{{TAGLINE}}           One-line value proposition
{{PRIMARY_ENTITY}}    Main data object (singular)
{{SECONDARY_ENTITY}}  Supporting data object (singular)
{{BRAND_PRIMARY}}     Primary hex color
{{BRAND_ACCENT}}      Accent hex color
{{CURRENCY}}          ISO currency code (default: usd)
{{PLATFORM_FEE}}      Percentage taken by platform (marketplace only)
{{CTA_PRIMARY}}       Primary call to action text
{{CTA_SECONDARY}}     Secondary call to action text
{{SUPPORT_EMAIL}}     Support contact email
{{DOMAIN}}            App domain (e.g. myapp.denovoai.co)
```

Additional tokens are template-specific and listed per slot map below.

---

## Archetype Registry

| Archetype | Purpose | Core Monetization | Complexity |
|---|---|---|---|
| Marketplace | Multi-party transactions | Take rate, listing fees | High |
| SaaS Tool | Single-product recurring value | Subscriptions, usage | Medium |
| Client Portal | Private service delivery workspace | Retainers, project fees | Medium |
| Internal Tool | Ops/admin for internal teams | Subscriptions, seats | Medium |
| Commerce | Storefront and checkout | Sales, subscriptions | Medium |
| Community | Member interaction, gated access | Memberships, upsells | Medium |
| Directory | Discovery and lead generation | Listings, leads, sponsorships | Low-Medium |
| Content Platform | Publishing-first apps | Subscriptions, courses, ads | Low-Medium |

---

## Rules

- Archetype = routing class
- Template = cloned baseline app
- Slot map = pre-configured token set for a specific variant
- Intent Parser matches user description → nearest slot map → fills gaps → confirms → Assembler runs
- Templates are runnable baselines, not bespoke apps, not empty scaffolds

---

## WAVE 1 — Build These First ⭐

These 8 cover the widest range and prove the system end to end:

1. ⭐ `marketplace-service`
2. ⭐ `saas-dashboard`
3. ⭐ `saas-ai-tool`
4. ⭐ `portal-agency`
5. ⭐ `internal-crm`
6. ⭐ `commerce-digital-store`
7. ⭐ `directory-vendor`
8. ⭐ `content-publication`

---

## ARCHETYPE: MARKETPLACE

### `marketplace-service` ⭐ Wave 1
```json
{
  "slug": "marketplace-service",
  "name": "Service Marketplace",
  "archetype": "MARKETPLACE",
  "wave": 1,
  "core_entities": ["users", "providers", "services", "bookings", "reviews", "payouts"],
  "snippets": {
    "required": [1, 2, 5, 6, 8, 9, 10, 11, 12, 15],
    "optional": [3, 4, 14]
  },
  "tokens": {
    "APP_NAME": "{{APP_NAME}}",
    "APP_SLUG": "{{APP_SLUG}}",
    "TAGLINE": "Find and hire the best {{PRIMARY_ENTITY}} providers for any project.",
    "PRIMARY_ENTITY": "service",
    "SECONDARY_ENTITY": "booking",
    "BRAND_PRIMARY": "#8B5CF6",
    "BRAND_ACCENT": "#06B6D4",
    "CURRENCY": "usd",
    "PLATFORM_FEE": "10",
    "CTA_PRIMARY": "Find a Provider",
    "CTA_SECONDARY": "Become a Provider",
    "SUPPORT_EMAIL": "support@{{APP_SLUG}}.com",
    "DOMAIN": "{{APP_SLUG}}.denovoai.co",
    "SELLER_NOUN": "provider",
    "BUYER_NOUN": "client",
    "CATEGORIES": ["Design", "Development", "Marketing", "Writing", "Video", "Photography"]
  },
  "schema_extras": ["portfolio_url", "turnaround_days", "revisions_included", "skills[]"],
  "example_apps": ["Fiverr clone", "Upwork alternative", "Freelance marketplace"]
}
```

### `marketplace-rental`
```json
{
  "slug": "marketplace-rental",
  "name": "Rental Marketplace",
  "archetype": "MARKETPLACE",
  "wave": 2,
  "core_entities": ["users", "items", "availability", "bookings", "deposits", "reviews"],
  "snippets": {
    "required": [1, 2, 5, 6, 8, 9, 11, 12, 15],
    "optional": [4, 10, 14]
  },
  "tokens": {
    "APP_NAME": "{{APP_NAME}}",
    "APP_SLUG": "{{APP_SLUG}}",
    "TAGLINE": "Rent anything from trusted owners near you.",
    "PRIMARY_ENTITY": "rental",
    "SECONDARY_ENTITY": "booking",
    "BRAND_PRIMARY": "#F59E0B",
    "BRAND_ACCENT": "#10B981",
    "CURRENCY": "usd",
    "PLATFORM_FEE": "12",
    "CTA_PRIMARY": "Browse Rentals",
    "CTA_SECONDARY": "List Your Item",
    "SUPPORT_EMAIL": "support@{{APP_SLUG}}.com",
    "DOMAIN": "{{APP_SLUG}}.denovoai.co",
    "SELLER_NOUN": "owner",
    "BUYER_NOUN": "renter",
    "CATEGORIES": ["Cameras", "Tools", "Vehicles", "Electronics", "Sports", "Events"]
  },
  "schema_extras": ["daily_rate_cents", "deposit_cents", "pickup_location", "condition", "min_rental_days"],
  "example_apps": ["Camera gear rental", "Tool library", "Event equipment rental"]
}
```

### `marketplace-digital-goods`
```json
{
  "slug": "marketplace-digital-goods",
  "name": "Digital Goods Marketplace",
  "archetype": "MARKETPLACE",
  "wave": 2,
  "core_entities": ["users", "products", "purchases", "downloads", "reviews"],
  "snippets": {
    "required": [1, 2, 5, 6, 7, 8, 9, 11, 15],
    "optional": [4, 14]
  },
  "tokens": {
    "APP_NAME": "{{APP_NAME}}",
    "APP_SLUG": "{{APP_SLUG}}",
    "TAGLINE": "Buy and sell premium digital products.",
    "PRIMARY_ENTITY": "product",
    "SECONDARY_ENTITY": "download",
    "BRAND_PRIMARY": "#6366F1",
    "BRAND_ACCENT": "#EC4899",
    "CURRENCY": "usd",
    "PLATFORM_FEE": "15",
    "CTA_PRIMARY": "Browse Products",
    "CTA_SECONDARY": "Start Selling",
    "SUPPORT_EMAIL": "support@{{APP_SLUG}}.com",
    "DOMAIN": "{{APP_SLUG}}.denovoai.co",
    "SELLER_NOUN": "creator",
    "BUYER_NOUN": "buyer",
    "CATEGORIES": ["Templates", "UI Kits", "Fonts", "Icons", "Photos", "Code", "Audio"]
  },
  "schema_extras": ["file_format", "file_size_mb", "license_type", "preview_url", "version"],
  "example_apps": ["Design asset marketplace", "Template store", "Stock audio marketplace"]
}
```

### `marketplace-vendor-b2b`
```json
{
  "slug": "marketplace-vendor-b2b",
  "name": "Vendor / B2B Marketplace",
  "archetype": "MARKETPLACE",
  "wave": 2,
  "core_entities": ["buyers", "vendors", "listings", "inquiries", "orders"],
  "snippets": {
    "required": [1, 2, 5, 6, 8, 9, 10, 15],
    "optional": [4, 11, 14]
  },
  "tokens": {
    "APP_NAME": "{{APP_NAME}}",
    "APP_SLUG": "{{APP_SLUG}}",
    "TAGLINE": "Find vetted vendors for your business.",
    "PRIMARY_ENTITY": "vendor",
    "SECONDARY_ENTITY": "inquiry",
    "BRAND_PRIMARY": "#1E40AF",
    "BRAND_ACCENT": "#059669",
    "CURRENCY": "usd",
    "PLATFORM_FEE": "8",
    "CTA_PRIMARY": "Find a Vendor",
    "CTA_SECONDARY": "List Your Business",
    "SUPPORT_EMAIL": "support@{{APP_SLUG}}.com",
    "DOMAIN": "{{APP_SLUG}}.denovoai.co",
    "SELLER_NOUN": "vendor",
    "BUYER_NOUN": "buyer",
    "CATEGORIES": ["Manufacturing", "Logistics", "Tech Services", "Marketing", "Legal", "Finance"]
  },
  "schema_extras": ["company_name", "company_size", "certifications[]", "service_areas[]", "min_order_cents", "lead_time_days"],
  "example_apps": ["Supplier network", "B2B service marketplace", "Agency directory with payments"]
}
```

---

## ARCHETYPE: SAAS TOOL

### `saas-dashboard` ⭐ Wave 1
```json
{
  "slug": "saas-dashboard",
  "name": "Dashboard SaaS",
  "archetype": "SAAS_TOOL",
  "wave": 1,
  "core_entities": ["users", "accounts", "projects", "reports"],
  "snippets": {
    "required": [1, 2, 5, 8, 9, 15],
    "optional": [4, 6, 14]
  },
  "tokens": {
    "APP_NAME": "{{APP_NAME}}",
    "APP_SLUG": "{{APP_SLUG}}",
    "TAGLINE": "All your {{PRIMARY_ENTITY}}s in one dashboard.",
    "PRIMARY_ENTITY": "project",
    "SECONDARY_ENTITY": "report",
    "BRAND_PRIMARY": "#0F172A",
    "BRAND_ACCENT": "#3B82F6",
    "CURRENCY": "usd",
    "PLATFORM_FEE": "0",
    "CTA_PRIMARY": "Start Free Trial",
    "CTA_SECONDARY": "See a Demo",
    "SUPPORT_EMAIL": "support@{{APP_SLUG}}.com",
    "DOMAIN": "{{APP_SLUG}}.denovoai.co",
    "FREE_LIMIT": "1",
    "PRO_PRICE": "29",
    "PRO_LIMIT": "10"
  },
  "schema_extras": ["chart_config", "date_range", "data_source_url", "refresh_interval_minutes"],
  "example_apps": ["Analytics dashboard", "KPI tracker", "Reporting tool", "Business intelligence app"]
}
```

### `saas-ai-tool` ⭐ Wave 1
```json
{
  "slug": "saas-ai-tool",
  "name": "AI Tool SaaS",
  "archetype": "SAAS_TOOL",
  "wave": 1,
  "core_entities": ["users", "workspaces", "jobs", "outputs", "usage"],
  "snippets": {
    "required": [1, 2, 5, 7, 8, 9, 15],
    "optional": [4, 14]
  },
  "tokens": {
    "APP_NAME": "{{APP_NAME}}",
    "APP_SLUG": "{{APP_SLUG}}",
    "TAGLINE": "Generate {{PRIMARY_ENTITY}}s instantly with AI.",
    "PRIMARY_ENTITY": "document",
    "SECONDARY_ENTITY": "output",
    "BRAND_PRIMARY": "#7C3AED",
    "BRAND_ACCENT": "#F59E0B",
    "CURRENCY": "usd",
    "PLATFORM_FEE": "0",
    "CTA_PRIMARY": "Generate Free",
    "CTA_SECONDARY": "See Examples",
    "SUPPORT_EMAIL": "support@{{APP_SLUG}}.com",
    "DOMAIN": "{{APP_SLUG}}.denovoai.co",
    "FREE_LIMIT": "3",
    "PRO_PRICE": "29",
    "PRO_LIMIT": "100"
  },
  "schema_extras": ["ai_model", "prompt_template", "output_format", "word_count", "language", "tone"],
  "example_apps": ["AI writer", "Resume generator", "SEO tool", "Invoice generator", "Contract drafter", "Email writer"]
}
```

### `saas-workflow`
```json
{
  "slug": "saas-workflow",
  "name": "Form / Workflow SaaS",
  "archetype": "SAAS_TOOL",
  "wave": 2,
  "core_entities": ["users", "forms", "workflows", "submissions", "automations"],
  "snippets": {
    "required": [1, 2, 5, 7, 8, 9, 14, 15],
    "optional": [4, 6]
  },
  "tokens": {
    "APP_NAME": "{{APP_NAME}}",
    "APP_SLUG": "{{APP_SLUG}}",
    "TAGLINE": "Build and share {{PRIMARY_ENTITY}}s in minutes.",
    "PRIMARY_ENTITY": "form",
    "SECONDARY_ENTITY": "submission",
    "BRAND_PRIMARY": "#0D9488",
    "BRAND_ACCENT": "#F97316",
    "CURRENCY": "usd",
    "PLATFORM_FEE": "0",
    "CTA_PRIMARY": "Build Free",
    "CTA_SECONDARY": "See Templates",
    "SUPPORT_EMAIL": "support@{{APP_SLUG}}.com",
    "DOMAIN": "{{APP_SLUG}}.denovoai.co",
    "FREE_LIMIT": "3",
    "PRO_PRICE": "19",
    "PRO_LIMIT": "25"
  },
  "schema_extras": ["form_schema", "submission_count", "is_public", "redirect_url", "notification_email", "logic_rules"],
  "example_apps": ["Form builder", "Survey tool", "Feedback collector", "Lead capture", "Quiz builder"]
}
```

### `saas-utility`
```json
{
  "slug": "saas-utility",
  "name": "Subscription Utility App",
  "archetype": "SAAS_TOOL",
  "wave": 2,
  "core_entities": ["users", "accounts", "settings", "jobs", "billing"],
  "snippets": {
    "required": [1, 2, 5, 8, 9, 15],
    "optional": [4, 14]
  },
  "tokens": {
    "APP_NAME": "{{APP_NAME}}",
    "APP_SLUG": "{{APP_SLUG}}",
    "TAGLINE": "The {{PRIMARY_ENTITY}} tool built for how you work.",
    "PRIMARY_ENTITY": "tool",
    "SECONDARY_ENTITY": "setting",
    "BRAND_PRIMARY": "#374151",
    "BRAND_ACCENT": "#10B981",
    "CURRENCY": "usd",
    "PLATFORM_FEE": "0",
    "CTA_PRIMARY": "Get Started Free",
    "CTA_SECONDARY": "View Pricing",
    "SUPPORT_EMAIL": "support@{{APP_SLUG}}.com",
    "DOMAIN": "{{APP_SLUG}}.denovoai.co",
    "FREE_LIMIT": "5",
    "PRO_PRICE": "9",
    "PRO_LIMIT": "999"
  },
  "schema_extras": ["settings_json", "feature_flags"],
  "example_apps": ["Password manager", "Bookmark tool", "Note app", "Link shortener", "URL monitor"]
}
```

---

## ARCHETYPE: CLIENT PORTAL

### `portal-agency` ⭐ Wave 1
```json
{
  "slug": "portal-agency",
  "name": "Agency Portal",
  "archetype": "CLIENT_PORTAL",
  "wave": 1,
  "core_entities": ["clients", "projects", "files", "invoices", "messages"],
  "snippets": {
    "required": [1, 4, 5, 8, 9, 10, 15],
    "optional": [2, 6, 14]
  },
  "tokens": {
    "APP_NAME": "{{APP_NAME}}",
    "APP_SLUG": "{{APP_SLUG}}",
    "TAGLINE": "Your projects, delivered with clarity.",
    "PRIMARY_ENTITY": "project",
    "SECONDARY_ENTITY": "deliverable",
    "BRAND_PRIMARY": "#1E293B",
    "BRAND_ACCENT": "#6366F1",
    "CURRENCY": "usd",
    "PLATFORM_FEE": "0",
    "CTA_PRIMARY": "View Your Projects",
    "CTA_SECONDARY": "Contact Us",
    "SUPPORT_EMAIL": "support@{{APP_SLUG}}.com",
    "DOMAIN": "{{APP_SLUG}}.denovoai.co",
    "PROVIDER_NOUN": "agency",
    "CLIENT_NOUN": "client"
  },
  "schema_extras": ["project_type", "brand_assets_url", "revision_count", "approval_status", "kickoff_date"],
  "example_apps": ["Design agency portal", "Dev agency client dashboard", "Marketing agency portal", "PR agency portal"]
}
```

### `portal-coaching`
```json
{
  "slug": "portal-coaching",
  "name": "Coaching / Program Portal",
  "archetype": "CLIENT_PORTAL",
  "wave": 2,
  "core_entities": ["clients", "programs", "sessions", "resources", "messages"],
  "snippets": {
    "required": [1, 4, 5, 8, 9, 10, 12, 15],
    "optional": [2, 14]
  },
  "tokens": {
    "APP_NAME": "{{APP_NAME}}",
    "APP_SLUG": "{{APP_SLUG}}",
    "TAGLINE": "Everything your clients need, in one place.",
    "PRIMARY_ENTITY": "program",
    "SECONDARY_ENTITY": "session",
    "BRAND_PRIMARY": "#7C3AED",
    "BRAND_ACCENT": "#EC4899",
    "CURRENCY": "usd",
    "PLATFORM_FEE": "0",
    "CTA_PRIMARY": "Access Your Program",
    "CTA_SECONDARY": "Book a Session",
    "SUPPORT_EMAIL": "support@{{APP_SLUG}}.com",
    "DOMAIN": "{{APP_SLUG}}.denovoai.co",
    "PROVIDER_NOUN": "coach",
    "CLIENT_NOUN": "client"
  },
  "schema_extras": ["session_notes", "homework_url", "next_session_date", "progress_score", "program_phase"],
  "example_apps": ["Life coach portal", "Business coach dashboard", "Online program portal", "Therapist portal"]
}
```

### `portal-service-workspace`
```json
{
  "slug": "portal-service-workspace",
  "name": "Client Service Workspace",
  "archetype": "CLIENT_PORTAL",
  "wave": 2,
  "core_entities": ["clients", "requests", "deliverables", "approvals"],
  "snippets": {
    "required": [1, 4, 5, 8, 9, 10, 15],
    "optional": [2, 6, 14]
  },
  "tokens": {
    "APP_NAME": "{{APP_NAME}}",
    "APP_SLUG": "{{APP_SLUG}}",
    "TAGLINE": "Your engagements run smoother here.",
    "PRIMARY_ENTITY": "engagement",
    "SECONDARY_ENTITY": "asset",
    "BRAND_PRIMARY": "#0F766E",
    "BRAND_ACCENT": "#F59E0B",
    "CURRENCY": "usd",
    "PLATFORM_FEE": "0",
    "CTA_PRIMARY": "Enter Workspace",
    "CTA_SECONDARY": "Request Access",
    "SUPPORT_EMAIL": "support@{{APP_SLUG}}.com",
    "DOMAIN": "{{APP_SLUG}}.denovoai.co",
    "PROVIDER_NOUN": "team",
    "CLIENT_NOUN": "partner"
  },
  "schema_extras": ["contract_url", "sla_hours", "account_manager_id", "renewal_date", "service_tier"],
  "example_apps": ["Retainer workspace", "Managed service portal", "Outsourced ops hub", "Consultant workspace"]
}
```

---

## ARCHETYPE: INTERNAL TOOL

### `internal-crm` ⭐ Wave 1
```json
{
  "slug": "internal-crm",
  "name": "CRM / Pipeline Tool",
  "archetype": "INTERNAL_TOOL",
  "wave": 1,
  "core_entities": ["leads", "accounts", "contacts", "deals", "activities"],
  "snippets": {
    "required": [1, 5, 6, 8, 9, 15],
    "optional": [2, 4, 14]
  },
  "tokens": {
    "APP_NAME": "{{APP_NAME}}",
    "APP_SLUG": "{{APP_SLUG}}",
    "TAGLINE": "Close more deals. Lose fewer leads.",
    "PRIMARY_ENTITY": "contact",
    "SECONDARY_ENTITY": "deal",
    "BRAND_PRIMARY": "#1E40AF",
    "BRAND_ACCENT": "#F59E0B",
    "CURRENCY": "usd",
    "PLATFORM_FEE": "0",
    "CTA_PRIMARY": "Open CRM",
    "CTA_SECONDARY": "Import Contacts",
    "SUPPORT_EMAIL": "support@{{APP_SLUG}}.com",
    "DOMAIN": "{{APP_SLUG}}.denovoai.co",
    "PIPELINE_STAGES": ["New Lead", "Contacted", "Qualified", "Proposal Sent", "Closed Won", "Closed Lost"]
  },
  "schema_extras": ["email", "phone", "company", "deal_value_cents", "close_date", "source", "last_contacted_at", "notes"],
  "example_apps": ["Sales CRM", "Lead tracker", "Pipeline manager", "Contact database"]
}
```

### `internal-ops-dashboard`
```json
{
  "slug": "internal-ops-dashboard",
  "name": "Ops Dashboard",
  "archetype": "INTERNAL_TOOL",
  "wave": 2,
  "core_entities": ["users", "records", "metrics", "tasks", "alerts"],
  "snippets": {
    "required": [1, 5, 6, 8, 9, 15],
    "optional": [4, 14]
  },
  "tokens": {
    "APP_NAME": "{{APP_NAME}}",
    "APP_SLUG": "{{APP_SLUG}}",
    "TAGLINE": "Your operations, under control.",
    "PRIMARY_ENTITY": "task",
    "SECONDARY_ENTITY": "metric",
    "BRAND_PRIMARY": "#111827",
    "BRAND_ACCENT": "#10B981",
    "CURRENCY": "usd",
    "PLATFORM_FEE": "0",
    "CTA_PRIMARY": "Open Dashboard",
    "CTA_SECONDARY": "Add Record",
    "SUPPORT_EMAIL": "support@{{APP_SLUG}}.com",
    "DOMAIN": "{{APP_SLUG}}.denovoai.co",
    "PIPELINE_STAGES": ["Backlog", "In Progress", "Review", "Done", "Blocked"]
  },
  "schema_extras": ["assignee_id", "due_date", "estimated_hours", "actual_hours", "blocker_notes", "priority"],
  "example_apps": ["Project tracker", "Team task board", "Sprint planner", "Ops center"]
}
```

### `internal-backoffice`
```json
{
  "slug": "internal-backoffice",
  "name": "Admin / Backoffice Tool",
  "archetype": "INTERNAL_TOOL",
  "wave": 2,
  "core_entities": ["users", "records", "workflows", "approvals"],
  "snippets": {
    "required": [1, 5, 6, 8, 9, 15],
    "optional": [4, 10, 14]
  },
  "tokens": {
    "APP_NAME": "{{APP_NAME}}",
    "APP_SLUG": "{{APP_SLUG}}",
    "TAGLINE": "Manage everything from one place.",
    "PRIMARY_ENTITY": "record",
    "SECONDARY_ENTITY": "log",
    "BRAND_PRIMARY": "#18181B",
    "BRAND_ACCENT": "#A855F7",
    "CURRENCY": "usd",
    "PLATFORM_FEE": "0",
    "CTA_PRIMARY": "Open Backoffice",
    "CTA_SECONDARY": "View Reports",
    "SUPPORT_EMAIL": "support@{{APP_SLUG}}.com",
    "DOMAIN": "{{APP_SLUG}}.denovoai.co",
    "PIPELINE_STAGES": ["Active", "Pending", "Suspended", "Archived", "Flagged"]
  },
  "schema_extras": ["external_id", "source_system", "processed_at", "flagged_reason", "reviewed_by"],
  "example_apps": ["User management tool", "Content moderation dashboard", "Finance backoffice", "Compliance tool"]
}
```

---

## ARCHETYPE: COMMERCE

### `commerce-digital-store` ⭐ Wave 1
```json
{
  "slug": "commerce-digital-store",
  "name": "Digital Product Store",
  "archetype": "COMMERCE",
  "wave": 1,
  "core_entities": ["products", "customers", "orders", "downloads"],
  "snippets": {
    "required": [1, 2, 5, 7, 9, 15],
    "optional": [4, 11, 14]
  },
  "tokens": {
    "APP_NAME": "{{APP_NAME}}",
    "APP_SLUG": "{{APP_SLUG}}",
    "TAGLINE": "Premium digital products, instantly delivered.",
    "PRIMARY_ENTITY": "product",
    "SECONDARY_ENTITY": "download",
    "BRAND_PRIMARY": "#312E81",
    "BRAND_ACCENT": "#F59E0B",
    "CURRENCY": "usd",
    "PLATFORM_FEE": "0",
    "CTA_PRIMARY": "Browse Products",
    "CTA_SECONDARY": "Start Selling",
    "SUPPORT_EMAIL": "support@{{APP_SLUG}}.com",
    "DOMAIN": "{{APP_SLUG}}.denovoai.co",
    "PRODUCT_TYPE": "digital",
    "CATEGORIES": ["Templates", "UI Kits", "Fonts", "Photos", "Audio", "Code"]
  },
  "schema_extras": ["file_format", "file_size_mb", "license_type", "preview_url", "version", "download_count"],
  "example_apps": ["Template shop", "Stock photo store", "Audio sample store", "Icon pack shop", "Code snippet store"]
}
```

### `commerce-subscription`
```json
{
  "slug": "commerce-subscription",
  "name": "Subscription Commerce",
  "archetype": "COMMERCE",
  "wave": 2,
  "core_entities": ["products", "plans", "customers", "subscriptions"],
  "snippets": {
    "required": [1, 2, 5, 9, 15],
    "optional": [4, 14]
  },
  "tokens": {
    "APP_NAME": "{{APP_NAME}}",
    "APP_SLUG": "{{APP_SLUG}}",
    "TAGLINE": "Get {{PRIMARY_ENTITY}}s delivered every month.",
    "PRIMARY_ENTITY": "box",
    "SECONDARY_ENTITY": "shipment",
    "BRAND_PRIMARY": "#7C2D12",
    "BRAND_ACCENT": "#FCD34D",
    "CURRENCY": "usd",
    "PLATFORM_FEE": "0",
    "CTA_PRIMARY": "Subscribe Now",
    "CTA_SECONDARY": "See What's Inside",
    "SUPPORT_EMAIL": "support@{{APP_SLUG}}.com",
    "DOMAIN": "{{APP_SLUG}}.denovoai.co",
    "PRODUCT_TYPE": "subscription",
    "CATEGORIES": ["Monthly", "Quarterly", "Annual", "Gift"]
  },
  "schema_extras": ["shipping_address", "frequency", "next_shipment_date", "box_contents", "pause_until"],
  "example_apps": ["Subscription box", "Coffee club", "Book club", "Monthly wellness box"]
}
```

### `commerce-catalog`
```json
{
  "slug": "commerce-catalog",
  "name": "Simple Catalog Storefront",
  "archetype": "COMMERCE",
  "wave": 2,
  "core_entities": ["products", "categories", "customers", "orders"],
  "snippets": {
    "required": [1, 2, 5, 6, 9, 15],
    "optional": [4, 11, 14]
  },
  "tokens": {
    "APP_NAME": "{{APP_NAME}}",
    "APP_SLUG": "{{APP_SLUG}}",
    "TAGLINE": "Shop the collection.",
    "PRIMARY_ENTITY": "product",
    "SECONDARY_ENTITY": "order",
    "BRAND_PRIMARY": "#1C1917",
    "BRAND_ACCENT": "#DC2626",
    "CURRENCY": "usd",
    "PLATFORM_FEE": "0",
    "CTA_PRIMARY": "Shop Now",
    "CTA_SECONDARY": "View Collections",
    "SUPPORT_EMAIL": "support@{{APP_SLUG}}.com",
    "DOMAIN": "{{APP_SLUG}}.denovoai.co",
    "PRODUCT_TYPE": "physical",
    "CATEGORIES": ["New Arrivals", "Bestsellers", "Sale", "Collections"]
  },
  "schema_extras": ["sku", "stock_count", "weight_grams", "dimensions", "shipping_class", "variants"],
  "example_apps": ["Boutique store", "Merch shop", "Brand storefront", "Craft store"]
}
```

---

## ARCHETYPE: COMMUNITY

### `community-membership`
```json
{
  "slug": "community-membership",
  "name": "Membership Community",
  "archetype": "COMMUNITY",
  "wave": 2,
  "core_entities": ["members", "posts", "groups", "comments"],
  "snippets": {
    "required": [1, 5, 8, 9, 10, 15],
    "optional": [4, 11, 14]
  },
  "tokens": {
    "APP_NAME": "{{APP_NAME}}",
    "APP_SLUG": "{{APP_SLUG}}",
    "TAGLINE": "A community for people who take {{PRIMARY_ENTITY} seriously.",
    "PRIMARY_ENTITY": "post",
    "SECONDARY_ENTITY": "comment",
    "BRAND_PRIMARY": "#1D4ED8",
    "BRAND_ACCENT": "#F59E0B",
    "CURRENCY": "usd",
    "PLATFORM_FEE": "0",
    "CTA_PRIMARY": "Join the Community",
    "CTA_SECONDARY": "Learn More",
    "SUPPORT_EMAIL": "support@{{APP_SLUG}}.com",
    "DOMAIN": "{{APP_SLUG}}.denovoai.co",
    "MEMBER_NOUN": "member",
    "PRO_PRICE": "19",
    "CATEGORIES": ["General", "Resources", "Jobs", "Introductions", "Off-Topic"]
  },
  "schema_extras": ["badge", "reputation_score", "member_since", "location"],
  "example_apps": ["Indie hacker community", "Professional network", "Niche interest group", "Alumni community"]
}
```

### `community-creator-hub`
```json
{
  "slug": "community-creator-hub",
  "name": "Creator Hub",
  "archetype": "COMMUNITY",
  "wave": 2,
  "core_entities": ["creators", "members", "content", "messages"],
  "snippets": {
    "required": [1, 2, 5, 8, 9, 10, 15],
    "optional": [4, 14]
  },
  "tokens": {
    "APP_NAME": "{{APP_NAME}}",
    "APP_SLUG": "{{APP_SLUG}}",
    "TAGLINE": "Where creators share, learn, and grow together.",
    "PRIMARY_ENTITY": "project",
    "SECONDARY_ENTITY": "comment",
    "BRAND_PRIMARY": "#7C3AED",
    "BRAND_ACCENT": "#F97316",
    "CURRENCY": "usd",
    "PLATFORM_FEE": "0",
    "CTA_PRIMARY": "Join the Hub",
    "CTA_SECONDARY": "Share Your Work",
    "SUPPORT_EMAIL": "support@{{APP_SLUG}}.com",
    "DOMAIN": "{{APP_SLUG}}.denovoai.co",
    "MEMBER_NOUN": "creator",
    "PRO_PRICE": "9",
    "CATEGORIES": ["Design", "Development", "Writing", "Video", "Music", "Photography"]
  },
  "schema_extras": ["portfolio_url", "skills[]", "available_for_hire", "featured_work_url", "social_links"],
  "example_apps": ["Designer portfolio community", "Developer showcase", "Writer's room", "Indie game dev hub"]
}
```

### `community-private-network`
```json
{
  "slug": "community-private-network",
  "name": "Private Network",
  "archetype": "COMMUNITY",
  "wave": 2,
  "core_entities": ["users", "groups", "threads", "invites"],
  "snippets": {
    "required": [1, 5, 8, 9, 10, 15],
    "optional": [4, 11]
  },
  "tokens": {
    "APP_NAME": "{{APP_NAME}}",
    "APP_SLUG": "{{APP_SLUG}}",
    "TAGLINE": "An exclusive network for people who qualify.",
    "PRIMARY_ENTITY": "discussion",
    "SECONDARY_ENTITY": "invite",
    "BRAND_PRIMARY": "#0F172A",
    "BRAND_ACCENT": "#D97706",
    "CURRENCY": "usd",
    "PLATFORM_FEE": "0",
    "CTA_PRIMARY": "Apply for Access",
    "CTA_SECONDARY": "Learn About Membership",
    "SUPPORT_EMAIL": "support@{{APP_SLUG}}.com",
    "DOMAIN": "{{APP_SLUG}}.denovoai.co",
    "MEMBER_NOUN": "member",
    "PRO_PRICE": "49",
    "CATEGORIES": ["Strategy", "Deals", "Intros", "Resources", "Events"]
  },
  "schema_extras": ["application_status", "referred_by", "linkedin_url", "company", "title", "application_answers"],
  "example_apps": ["Executive network", "VC community", "Alumni network", "Mastermind group", "Operator collective"]
}
```

---

## ARCHETYPE: DIRECTORY

### `directory-vendor` ⭐ Wave 1
```json
{
  "slug": "directory-vendor",
  "name": "Vendor Directory",
  "archetype": "DIRECTORY",
  "wave": 1,
  "core_entities": ["vendors", "categories", "listings", "inquiries"],
  "snippets": {
    "required": [1, 5, 6, 9, 15],
    "optional": [4, 10, 11]
  },
  "tokens": {
    "APP_NAME": "{{APP_NAME}}",
    "APP_SLUG": "{{APP_SLUG}}",
    "TAGLINE": "Find the right vendor for your business.",
    "PRIMARY_ENTITY": "vendor",
    "SECONDARY_ENTITY": "inquiry",
    "BRAND_PRIMARY": "#0C4A6E",
    "BRAND_ACCENT": "#0EA5E9",
    "CURRENCY": "usd",
    "PLATFORM_FEE": "0",
    "CTA_PRIMARY": "Browse Vendors",
    "CTA_SECONDARY": "List Your Business",
    "SUPPORT_EMAIL": "support@{{APP_SLUG}}.com",
    "DOMAIN": "{{APP_SLUG}}.denovoai.co",
    "LISTING_NOUN": "vendor",
    "FEATURED_PRICE": "49",
    "APPROVAL_REQUIRED": "true",
    "CATEGORIES": ["Technology", "Marketing", "Finance", "Legal", "HR", "Operations"]
  },
  "schema_extras": ["company_name", "company_size", "founded_year", "certifications[]", "service_areas[]", "min_budget_cents", "website_url"],
  "example_apps": ["Wedding vendor directory", "SaaS tools directory", "Agency directory", "Supplier database"]
}
```

### `directory-job-board`
```json
{
  "slug": "directory-job-board",
  "name": "Job Board",
  "archetype": "DIRECTORY",
  "wave": 2,
  "core_entities": ["jobs", "companies", "applicants", "applications"],
  "snippets": {
    "required": [1, 5, 6, 8, 9, 15],
    "optional": [4, 10, 14]
  },
  "tokens": {
    "APP_NAME": "{{APP_NAME}}",
    "APP_SLUG": "{{APP_SLUG}}",
    "TAGLINE": "Find your next role. Or your next hire.",
    "PRIMARY_ENTITY": "job",
    "SECONDARY_ENTITY": "application",
    "BRAND_PRIMARY": "#1E3A5F",
    "BRAND_ACCENT": "#3B82F6",
    "CURRENCY": "usd",
    "PLATFORM_FEE": "0",
    "CTA_PRIMARY": "Browse Jobs",
    "CTA_SECONDARY": "Post a Job",
    "SUPPORT_EMAIL": "support@{{APP_SLUG}}.com",
    "DOMAIN": "{{APP_SLUG}}.denovoai.co",
    "LISTING_NOUN": "job",
    "FEATURED_PRICE": "99",
    "APPROVAL_REQUIRED": "false",
    "CATEGORIES": ["Engineering", "Design", "Marketing", "Sales", "Operations", "Remote"]
  },
  "schema_extras": ["salary_min_cents", "salary_max_cents", "employment_type", "experience_level", "remote_ok", "apply_url", "company_name", "company_logo_url"],
  "example_apps": ["Tech job board", "Remote jobs board", "Niche industry job board", "Startup jobs"]
}
```

### `directory-resource`
```json
{
  "slug": "directory-resource",
  "name": "Resource Directory",
  "archetype": "DIRECTORY",
  "wave": 2,
  "core_entities": ["resources", "categories", "tags", "saves"],
  "snippets": {
    "required": [1, 5, 6, 9],
    "optional": [4, 14, 15]
  },
  "tokens": {
    "APP_NAME": "{{APP_NAME}}",
    "APP_SLUG": "{{APP_SLUG}}",
    "TAGLINE": "The best resources, curated for you.",
    "PRIMARY_ENTITY": "resource",
    "SECONDARY_ENTITY": "save",
    "BRAND_PRIMARY": "#064E3B",
    "BRAND_ACCENT": "#34D399",
    "CURRENCY": "usd",
    "PLATFORM_FEE": "0",
    "CTA_PRIMARY": "Browse Resources",
    "CTA_SECONDARY": "Submit a Resource",
    "SUPPORT_EMAIL": "support@{{APP_SLUG}}.com",
    "DOMAIN": "{{APP_SLUG}}.denovoai.co",
    "LISTING_NOUN": "resource",
    "FEATURED_PRICE": "0",
    "APPROVAL_REQUIRED": "true",
    "CATEGORIES": ["Tools", "Articles", "Videos", "Templates", "Communities", "Courses"]
  },
  "schema_extras": ["resource_url", "pricing_type", "platform", "upvote_count", "submitted_by"],
  "example_apps": ["Dev tools directory", "Marketing resources hub", "Startup tools list", "Design resources"]
}
```

---

## ARCHETYPE: CONTENT PLATFORM

### `content-publication` ⭐ Wave 1
```json
{
  "slug": "content-publication",
  "name": "Blog / Publication",
  "archetype": "CONTENT_MEDIA",
  "wave": 1,
  "core_entities": ["posts", "categories", "authors", "subscribers"],
  "snippets": {
    "required": [5, 13, 15],
    "optional": [1, 2, 14]
  },
  "tokens": {
    "APP_NAME": "{{APP_NAME}}",
    "APP_SLUG": "{{APP_SLUG}}",
    "TAGLINE": "Insights worth reading.",
    "PRIMARY_ENTITY": "article",
    "SECONDARY_ENTITY": "series",
    "BRAND_PRIMARY": "#1C1917",
    "BRAND_ACCENT": "#DC2626",
    "CURRENCY": "usd",
    "PLATFORM_FEE": "0",
    "CTA_PRIMARY": "Read the Latest",
    "CTA_SECONDARY": "Subscribe",
    "SUPPORT_EMAIL": "support@{{APP_SLUG}}.com",
    "DOMAIN": "{{APP_SLUG}}.denovoai.co",
    "CONTENT_NOUN": "article",
    "FREE_LIMIT": "5",
    "PRO_PRICE": "9",
    "CATEGORIES": ["News", "Analysis", "Opinion", "Guides", "Interviews"]
  },
  "schema_extras": ["read_time", "word_count", "canonical_url", "series_id", "sponsor_name", "featured_image_url"],
  "example_apps": ["Substack alternative", "Industry newsletter", "Niche publication", "Tech blog with paywall"]
}
```

### `content-newsletter`
```json
{
  "slug": "content-newsletter",
  "name": "Newsletter Site",
  "archetype": "CONTENT_MEDIA",
  "wave": 2,
  "core_entities": ["posts", "issues", "subscribers", "campaigns"],
  "snippets": {
    "required": [5, 13, 15],
    "optional": [1, 2, 14]
  },
  "tokens": {
    "APP_NAME": "{{APP_NAME}}",
    "APP_SLUG": "{{APP_SLUG}}",
    "TAGLINE": "The newsletter people actually read.",
    "PRIMARY_ENTITY": "issue",
    "SECONDARY_ENTITY": "campaign",
    "BRAND_PRIMARY": "#1E1B4B",
    "BRAND_ACCENT": "#A78BFA",
    "CURRENCY": "usd",
    "PLATFORM_FEE": "0",
    "CTA_PRIMARY": "Subscribe Free",
    "CTA_SECONDARY": "Read the Archive",
    "SUPPORT_EMAIL": "support@{{APP_SLUG}}.com",
    "DOMAIN": "{{APP_SLUG}}.denovoai.co",
    "CONTENT_NOUN": "issue",
    "FREE_LIMIT": "3",
    "PRO_PRICE": "7",
    "CATEGORIES": ["Weekly", "Special Issues", "Sponsors", "Archive"]
  },
  "schema_extras": ["issue_number", "send_date", "open_rate", "sponsor_slot", "preview_text"],
  "example_apps": ["Weekly newsletter", "Paid digest", "Industry briefing", "Curated roundup"]
}
```

### `content-course-hub`
```json
{
  "slug": "content-course-hub",
  "name": "Course / Content Hub",
  "archetype": "CONTENT_MEDIA",
  "wave": 2,
  "core_entities": ["courses", "lessons", "members", "progress"],
  "snippets": {
    "required": [1, 2, 5, 8, 13, 15],
    "optional": [4, 9, 14]
  },
  "tokens": {
    "APP_NAME": "{{APP_NAME}}",
    "APP_SLUG": "{{APP_SLUG}}",
    "TAGLINE": "Learn from the best, at your own pace.",
    "PRIMARY_ENTITY": "lesson",
    "SECONDARY_ENTITY": "course",
    "BRAND_PRIMARY": "#0C4A6E",
    "BRAND_ACCENT": "#F59E0B",
    "CURRENCY": "usd",
    "PLATFORM_FEE": "0",
    "CTA_PRIMARY": "Start Learning",
    "CTA_SECONDARY": "Browse Courses",
    "SUPPORT_EMAIL": "support@{{APP_SLUG}}.com",
    "DOMAIN": "{{APP_SLUG}}.denovoai.co",
    "CONTENT_NOUN": "lesson",
    "FREE_LIMIT": "2",
    "PRO_PRICE": "29",
    "CATEGORIES": ["Beginner", "Intermediate", "Advanced", "Workshops", "Resources"]
  },
  "schema_extras": ["lesson_number", "video_url", "duration_minutes", "completion_status", "quiz_data", "certificate_url", "prerequisite_id"],
  "example_apps": ["Online course platform", "Skills training hub", "Bootcamp site", "Certification platform"]
}
```

---

## Master Summary

| # | Slug | Name | Archetype | Wave |
|---|---|---|---|---|
| 1 | marketplace-service | Service Marketplace | Marketplace | ⭐ 1 |
| 2 | marketplace-rental | Rental Marketplace | Marketplace | 2 |
| 3 | marketplace-digital-goods | Digital Goods Marketplace | Marketplace | 2 |
| 4 | marketplace-vendor-b2b | Vendor B2B Marketplace | Marketplace | 2 |
| 5 | saas-dashboard | Dashboard SaaS | SaaS Tool | ⭐ 1 |
| 6 | saas-ai-tool | AI Tool SaaS | SaaS Tool | ⭐ 1 |
| 7 | saas-workflow | Form Workflow SaaS | SaaS Tool | 2 |
| 8 | saas-utility | Subscription Utility | SaaS Tool | 2 |
| 9 | portal-agency | Agency Portal | Client Portal | ⭐ 1 |
| 10 | portal-coaching | Coaching Portal | Client Portal | 2 |
| 11 | portal-service-workspace | Client Service Workspace | Client Portal | 2 |
| 12 | internal-crm | CRM Pipeline | Internal Tool | ⭐ 1 |
| 13 | internal-ops-dashboard | Ops Dashboard | Internal Tool | 2 |
| 14 | internal-backoffice | Admin Backoffice | Internal Tool | 2 |
| 15 | commerce-digital-store | Digital Product Store | Commerce | ⭐ 1 |
| 16 | commerce-subscription | Subscription Commerce | Commerce | 2 |
| 17 | commerce-catalog | Simple Catalog Storefront | Commerce | 2 |
| 18 | community-membership | Membership Community | Community | 2 |
| 19 | community-creator-hub | Creator Hub | Community | 2 |
| 20 | community-private-network | Private Network | Community | 2 |
| 21 | directory-vendor | Vendor Directory | Directory | ⭐ 1 |
| 22 | directory-job-board | Job Board | Directory | 2 |
| 23 | directory-resource | Resource Directory | Directory | 2 |
| 24 | content-publication | Blog Publication | Content Platform | ⭐ 1 |
| 25 | content-newsletter | Newsletter Site | Content Platform | 2 |
| 26 | content-course-hub | Course Content Hub | Content Platform | 2 |

---

## Snippet Compatibility Matrix

### Legend
- R = Required at baseline
- O = Optional / supported
- N = Not applicable

### Archetype-Level Matrix

| Snippet | Marketplace | SaaS Tool | Client Portal | Internal Tool | Commerce | Community | Directory | Content Platform |
|---|---|---|---|---|---|---|---|---|
| 01 Auth | R | R | R | R | O | R | O | O |
| 02 Stripe Simple | O | R | O | N | R | O | O | O |
| 03 Stripe Connect | R | N | N | N | N | N | N | N |
| 04 File Upload | O | O | R | O | O | O | O | O |
| 05 Admin Panel | R | R | R | R | R | R | R | R |
| 06 Search & Filter | R | O | O | R | R | O | R | O |
| 07 Output & Delivery | O | R | O | N | R | N | N | O |
| 08 Roles & Permissions | R | R | R | R | O | R | O | O |
| 09 Notifications | R | R | R | R | R | R | O | O |
| 10 Messaging | R | O | R | O | N | R | O | N |
| 11 Reviews & Ratings | R | N | N | N | O | O | O | N |
| 12 Bookings | O | N | O | N | N | N | N | N |
| 13 Blog / CMS | N | N | N | N | N | N | N | R |
| 14 API + Webhooks | O | O | O | O | O | O | O | O |
| 15 Email Transactional | R | R | R | R | R | R | O | R |

---

### Template-Level Matrix

#### Marketplace
| Template | 01 | 02 | 03 | 04 | 05 | 06 | 07 | 08 | 09 | 10 | 11 | 12 | 13 | 14 | 15 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| marketplace-service | R | R | O | O | R | R | N | R | R | R | R | R | N | O | R |
| marketplace-rental | R | R | O | O | R | R | N | R | R | O | R | R | N | O | R |
| marketplace-digital-goods | R | R | O | O | R | R | R | R | R | O | R | N | N | O | R |
| marketplace-vendor-b2b | R | O | O | O | R | R | N | R | R | R | O | N | N | O | R |

#### SaaS Tool
| Template | 01 | 02 | 03 | 04 | 05 | 06 | 07 | 08 | 09 | 10 | 11 | 12 | 13 | 14 | 15 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| saas-dashboard | R | R | N | O | R | O | O | R | R | N | N | N | N | O | R |
| saas-ai-tool | R | R | N | O | R | O | R | R | R | N | N | N | N | O | R |
| saas-workflow | R | R | N | O | R | O | R | R | R | N | N | N | N | R | R |
| saas-utility | R | R | N | O | R | O | O | R | R | N | N | N | N | O | R |

#### Client Portal
| Template | 01 | 02 | 03 | 04 | 05 | 06 | 07 | 08 | 09 | 10 | 11 | 12 | 13 | 14 | 15 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| portal-agency | R | O | N | R | R | O | O | R | R | R | N | N | N | O | R |
| portal-coaching | R | O | N | R | R | O | O | R | R | R | N | R | N | O | R |
| portal-service-workspace | R | O | N | R | R | O | O | R | R | R | N | N | N | O | R |

#### Internal Tool
| Template | 01 | 02 | 03 | 04 | 05 | 06 | 07 | 08 | 09 | 10 | 11 | 12 | 13 | 14 | 15 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| internal-crm | R | N | N | O | R | R | N | R | R | O | N | N | N | O | R |
| internal-ops-dashboard | R | N | N | O | R | R | N | R | R | O | N | N | N | O | R |
| internal-backoffice | R | N | N | O | R | R | N | R | R | O | N | N | N | O | R |

#### Commerce
| Template | 01 | 02 | 03 | 04 | 05 | 06 | 07 | 08 | 09 | 10 | 11 | 12 | 13 | 14 | 15 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| commerce-digital-store | R | R | N | O | R | O | R | O | R | N | O | N | N | O | R |
| commerce-subscription | R | R | N | O | R | O | O | O | R | N | N | N | N | O | R |
| commerce-catalog | O | R | N | O | R | R | O | O | R | N | O | N | N | O | R |

#### Community
| Template | 01 | 02 | 03 | 04 | 05 | 06 | 07 | 08 | 09 | 10 | 11 | 12 | 13 | 14 | 15 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| community-membership | R | O | N | O | R | O | N | R | R | R | O | N | N | O | R |
| community-creator-hub | R | R | N | O | R | O | O | R | R | R | O | N | N | O | R |
| community-private-network | R | N | N | O | R | O | N | R | R | R | O | N | N | O | R |

#### Directory
| Template | 01 | 02 | 03 | 04 | 05 | 06 | 07 | 08 | 09 | 10 | 11 | 12 | 13 | 14 | 15 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| directory-job-board | O | O | N | O | R | R | N | O | O | O | N | N | N | O | R |
| directory-vendor | O | O | N | O | R | R | N | O | O | O | O | N | N | O | R |
| directory-resource | O | N | N | O | R | R | N | O | O | N | N | N | N | O | O |

#### Content Platform
| Template | 01 | 02 | 03 | 04 | 05 | 06 | 07 | 08 | 09 | 10 | 11 | 12 | 13 | 14 | 15 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| content-publication | O | O | N | O | R | O | N | O | O | N | N | N | R | O | R |
| content-newsletter | O | O | N | O | R | O | N | O | O | N | N | N | R | O | R |
| content-course-hub | R | R | N | O | R | O | O | R | O | N | N | N | R | O | R |

---

## Build Order Guidance

### Baseline-required before any template starts
01 Auth, 05 Admin Panel, 08 Roles & Permissions, 15 Email Transactional

### Usually needed early
02 Stripe Simple, 06 Search & Filter, 09 Notifications

### Feature-specific — add later
03 Stripe Connect, 04 File Upload, 07 Output & Delivery,
10 Messaging, 11 Reviews & Ratings, 12 Bookings,
13 Blog / CMS, 14 API + Webhooks

---

## Architectural Rule (non-negotiable)

> **The template consumes the snippet layer. It does not compete with it.**

Templates must not re-implement auth, payments, messaging, or any other
snippet logic. Templates call snippet APIs and mount snippet components.
Snippets are the substrate. Templates are the application layer on top.

If a template needs auth — it imports from `/snippets/auth/`.
If a template needs payments — it imports from `/snippets/stripe-simple/`.
Never implement these inline in the template itself.
