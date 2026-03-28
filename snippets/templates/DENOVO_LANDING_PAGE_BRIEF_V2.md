# DeNovo — Landing Page Build Brief v2
## Component placement map + all copy + policy content.
## This replaces the earlier landing page brief entirely.

---

## 🚨 CLOUDFLARE — ABSOLUTE NO-TOUCH ZONE
Port 4010. Do not touch Cloudflare, DNS, or tunnels.

---

## Implementation Rules

1. Legal/policy language must be visible but subordinate — not buried in
   unreadable fine print, but not dominating hero sections either
2. Commercial boundary language goes under pricing, not in hero
3. Keep CTA path clean throughout — every section drives to /auth/login
4. Do not expose internal stack details anywhere
5. Do not list full internal template inventory — keep it high-level
6. Pricing footnotes must appear under plan cards, not hidden in footer only
7. Long policy clauses belong on linked pages, not inline
8. No competitor naming

---

## Design Direction

Dark background: `#0A0A0F`
Primary accent: `#8B5CF6` (electric violet)
Secondary accent: `#06B6D4` (cyan — use sparingly)
Text primary: `#F8FAFC`
Text muted: `#94A3B8`
Tone: dark, technical, authoritative, premium
No purple gradients. No generic AI aesthetics.

---

## Page Structure — Complete Component Map

```
1.  Global Header
2.  Hero
3.  Problem
4.  What You Get
5.  How It Works
6.  Build vs Launch
7.  Pricing
    7a. Plan Cards (Build tab)
    7b. Plan Cards (Launch tab)
    7c. Pricing Notes
    7d. Add-Ons
    7e. FAQ
8.  Who It's For
9.  Templates
10. Trust
11. Final CTA
12. Footer
```

---

## Section 1: Global Header

Persistent. Top of every page.

```
Logo: DeNovo
Nav: Build | Launch | Templates | Pricing | FAQ
Secondary: Docs | Contact | Sign In
CTA button: Start Building → /auth/login
```

---

## Section 2: Hero

### H1
From idea to deployed business.

### Subhead
DeNovo turns a plain-English brief into production software.
Take the code, or let us run the product for you.

### CTAs
- Primary: `Start Building →` → /auth/login
- Secondary: `See How It Works` → scrolls to How It Works

### Hero visual
Terminal mock showing:
```
You:     I want a marketplace where event photographers
         sell their services to venues.

DeNovo:  Understood. Preparing the product for review.

DeNovo:  Proposed product:

         ShootSpace
         Service marketplace
         Platform fee model
         Bookings, reviews, messaging

         Proceed?

You:     Launch it.

DeNovo:  ✓ Structure confirmed
         ✓ Build complete
         ✓ Launch complete

DeNovo:  ShootSpace is live.
```

### 3-point support row (below terminal)
- Plain-English input
- Production-ready output
- Optional managed hosting

---

## Section 3: Problem

No section header. Flows from hero.

```
Most tools generate output.
DeNovo delivers product.

Code alone is not the asset.
A usable, launch-ready application is.

DeNovo is built for founders, operators, and agencies who want
a faster path from concept to working software without turning
every build into a custom engineering project.

DeNovo charges for software shipped, not prompts consumed.
```

---

## Section 4: What You Get

Section label: `WHAT YOU GET`
Headline: A cleaner path from concept to launch

Three cards:

**Production application**
A complete application with the core systems required to launch.

**Review before build**
You confirm the product structure, features, and business model
before work begins.

**Flexible handoff**
Take the codebase in-house, or keep the product under managed operation.

---

## Section 5: How It Works

Section label: `THE PROCESS`
Headline: Three steps to a working product

**1. Describe**
Tell DeNovo what you want to build in plain English.

**2. Review**
Confirm the proposed structure, core features, and commercial model
before build begins.

**3. Build or Launch**
Receive the codebase, or let DeNovo host and operate the product for you.

---

## Section 6: Build vs Launch

Section label: `TWO PRODUCTS`
Headline: Take the code. Or let us run it.

### DeNovo Build
*Generate and take the code.*

Includes:
- Full application codebase
- Core product systems
- Source code delivery
- Code ownership

Best for: developers, agencies, technical founders
Starting at: **$99/month**
CTA: `Start Building →`

### DeNovo Launch ⭐ Most Popular
*We host and run it for you.*

Everything in Build, plus:
- Managed hosting
- Maintenance
- Monitoring
- Backups
- Operational support

Best for: non-technical founders, operators, lean teams
Starting at: **$149/month per app**
CTA: `Launch Your Business →`

---

## Section 7: Pricing

Section label: `PRICING`
Headline: Simple pricing for software that ships

Subhead:
```
Choose Build if you want the code.
Choose Launch if you want the product hosted and operated for you.
```

Toggle: Monthly / Annual (Annual saves 20%)
Tabs: Build | Launch

---

### 7a: Build Plan Cards

| | Starter | Builder ⭐ | Studio | Agency |
|---|---|---|---|---|
| Price | $99/mo | $249/mo | $499/mo | $999/mo |
| Apps/mo | 3 | 10 | 25 | 60 |
| Output | Source code | Source code | Source code | Source code + white label |
| Support | Email | Priority | Priority | Dedicated |
| Overage | $59/app | $69/app | $79/app | $99/app |

Builder badge: `MOST POPULAR`

All Build plans include:
> Full source code ownership · Core product systems · Clear, predictable billing

---

### 7b: Launch Plan Cards

| | Launch 1 | Launch 5 | Launch 15 | Launch 40 |
|---|---|---|---|---|
| Price | $149/mo | $549/mo | $1,499/mo | $3,499/mo |
| Apps hosted | 1 | 5 | 15 | 40 |
| Overage | $129/app/mo | $139/app/mo | $149/app/mo | $169/app/mo |
| SLA | — | — | — | ✓ |

All Launch plans include:
> Managed hosting · Monitoring · Backups · Operational support

---

### 7c: Pricing Notes Block

Section title: **Pricing Notes**

Display all five footnotes visibly under the plan cards:

**Build**
Build includes code generation and source code delivery. Ongoing hosting,
communications, infrastructure usage, and third-party service costs are not
included unless explicitly stated.

**Launch**
Launch includes standard hosting, monitoring, backups, and routine platform
operations for ordinary commercial workloads. Usage-based services such as
email, SMS, storage, bandwidth, webhooks, and certain third-party integrations
may be quota-limited, customer-supplied, or billed separately.

**Compliance**
Standard plans are not intended for regulated healthcare, financial, insurance,
money transmission, or other high-compliance workloads unless explicitly
contracted.

**Ownership**
Build includes source code delivery. Domains, payment accounts, and certain
third-party provider accounts may be customer-owned depending on plan
configuration.

**Platform Protection**
DeNovo may apply quotas, throttles, suspensions, or plan changes where usage
creates abnormal cost, abuse risk, reputational harm, or compliance exposure.

---

### 7d: Add-Ons Block

Section title: **Available Add-Ons**

List:
- Managed Email
- Managed SMS
- Extra Storage
- Extra Bandwidth
- Advanced Backups
- Premium Monitoring & SLA
- Dedicated Environment
- Compliance Pack
- Integration Pack
- White-Glove Launch Setup

Note: *Some add-ons are usage-based, quota-limited, or subject to custom
scope and pricing.*

---

### 7e: FAQ Block

Section title: **Frequently Asked Questions**

Include all 11 FAQ items from DENOVO_POLICY_PACK.md Section 3.

Use accordion component — closed by default, expand on click.

---

## Section 8: Who It's For

Section label: `WHO IT'S FOR`
Headline: Built for people who ship.

Three cards:

**Solo Founder**
You have the idea and need a working product without a long development cycle.
→ DeNovo Build from $99/month

**Operator**
You are launching multiple products, offers, or revenue lines and need a
repeatable system.
→ DeNovo Build from $249/month

**Agency**
You deliver software for clients and need faster turnaround with clearer margins.
→ DeNovo Build from $999/month
→ DeNovo Launch from $549/month

---

## Section 9: Templates

Section label: `COMMON BUSINESS MODELS`
Headline: Templates for the business models that matter.

Eight cards:

| Template | Description |
|---|---|
| Marketplace | Bookings, services, listings, transactions |
| SaaS Tool | Dashboards, workflows, business utilities |
| Client Portal | Service delivery, approvals, account access |
| Internal Tool | Operations, admin, CRM, reporting |
| Commerce | Digital products, subscriptions, storefronts |
| Community | Membership, gated access, user networks |
| Directory | Discovery, lead generation, resource hubs |
| Content Platform | Publishing, newsletters, education products |

Footer line:
*Additional configurations available inside the platform.*

---

## Section 10: Trust

Section label: `WHY BUYERS CHOOSE DENOVO`

Four pillars (2x2 grid or 4-column row):

**Clear commercial model**
No token budgeting. No abstract credit math. Build and hosting are priced
in terms buyers can understand.

**Production-oriented output**
DeNovo is designed to produce working software intended for real use.

**Flexible handoff**
Take the codebase and run it yourself, or keep the product under managed hosting.

**Built for repeatable launch**
Designed for teams that need to move from concept to usable product with less
delivery drag.

---

## Section 11: Final CTA

Headline: Build the product. Keep the momentum.

Body:
```
Describe what you want to launch.
Review the structure.
Take the code, or let DeNovo run it for you.
```

CTA: `Start Building →` → /auth/login

Small text:
*Build plans include source code delivery.
Launch plans include managed hosting.*

---

## Section 12: Footer

### Navigation columns
**Product:** Build · Launch · Templates · Pricing
**Company:** About · Blog · Changelog
**Legal:** Privacy · Terms · Security · Acceptable Use
**Support:** Docs · Contact · Status

### Footer microcopy (policy bar above copyright line)
Display all four microcopy items from DENOVO_POLICY_PACK.md Section 4:
- Usage Note
- Compliance Note
- Ownership Note
- Protection Note

These go in a subdued policy bar — visible but not dominant.

### Footer tagline
DeNovo AI — From description to deployed business.

---

## Linked Policy Pages

These pages must exist and be linked from footer:

| Page | URL | Content source |
|---|---|---|
| Terms | /terms | DENOVO_POLICY_PACK.md Section 5 |
| Privacy | /privacy | Standard privacy policy scaffold |
| Acceptable Use | /acceptable-use | Section 5.3 |
| Launch Policy | /launch-policy | Sections 5.1 + 5.2 |
| Provider Policy | /provider-policy | Section 5.6 |
| Security | /security | Standard security page |

---

## Technical Implementation Notes

- Monthly/Annual toggle must be functional (Stripe price ID swap)
- Build/Launch tab switcher must be functional
- FAQ accordion — closed by default, smooth expand
- Terminal animation in hero types progressively on load
- Scroll-triggered section reveals
- All pricing must match Stripe products exactly
- `Start Building` and all CTAs → `/auth/login`
- Mobile responsive — all sections stack cleanly
- Policy pages are static content, no database needed
- Annual pricing = monthly × 10 (2 months free)

---

## What You Are NOT Doing

- ❌ Cloudflare, DNS, tunnels
- ❌ Exposing internal stack or pipeline details
- ❌ Listing all 26 templates publicly
- ❌ Naming competitors
- ❌ Burying legal language in unreadable fine print only
- ❌ Adding fake stats or social proof numbers

---

## When Done — Report Exactly

1. ✅/❌ All 12 sections render correctly
2. ✅/❌ Pricing toggle (monthly/annual) functional
3. ✅/❌ Build/Launch tab switcher functional
4. ✅/❌ FAQ accordion functional
5. ✅/❌ All 5 linked policy pages exist with correct content
6. ✅/❌ Footer microcopy present
7. ✅/❌ All CTAs link to /auth/login
8. ✅/❌ `npm run build` passes clean
