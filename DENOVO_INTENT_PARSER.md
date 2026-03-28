# DeNovo — Intent Parser Design
## The AI Brain That Extracts Slots from User Descriptions

---

## What It Does

Takes a user's natural language description of an app and produces a
complete, validated slot map that the Assembler can use to spin up a
deployable repo from a template.

Input:  "I want a marketplace for African fashion designers to sell their work"
Output: A fully populated JSON slot map + selected template + snippet list

---

## Conversation Flow

### Stage 1: First Message (always open-ended)

DeNovo greets the user and asks one question only:

```
Hi! Tell me about the app you want to build.
What does it do, and who is it for?
```

No forms. No dropdowns. Just a text box.

---

### Stage 2: Intent Extraction (internal, not shown to user)

After the user's first message, the parser runs silently:

```typescript
interface ExtractionResult {
  confidence: 'high' | 'medium' | 'low';
  template: TemplateType;           // Which archetype fits
  slots: Partial<SlotMap>;          // What we extracted
  missing: SlotKey[];               // What's still ambiguous
  assumptions: Assumption[];        // What we guessed + why
}
```

**Confidence rules:**
- `high` → description mentions archetype keywords clearly
  (e.g. "buy and sell", "book a service", "freelancers") + 80%+ slots filled
- `medium` → template is clear but 2-3 slots are ambiguous
- `low` → multiple templates could fit OR core slots are missing

---

### Stage 3: Clarification (only if needed)

If confidence is `medium` or `low`, the parser asks **one question at a time**,
most impactful first. Never more than 3 clarifying questions total.

**Priority order for clarification:**
1. Template selection (if ambiguous — e.g. could be SaaS OR marketplace)
2. Who are the two sides? (buyer/seller nouns)
3. What is being sold? (listing type: service, event, product, digital)
4. Business model (platform cut vs subscription to list)
5. Any must-have features (bookings? reviews? messaging?)

**Example exchange:**

```
User: "I want an app where people can hire local musicians"

Parser internally: template=Marketplace, confidence=high
  Missing: PLATFORM_FEE_%, CATEGORIES[], LISTING_NOUN

Parser asks:
  "Got it — a marketplace for hiring local musicians. 
   A couple of quick questions:

   1. What kinds of musicians or performances? 
      (e.g. wedding bands, solo guitarists, DJs, full orchestras)
   
   2. Does the platform take a cut of each booking, 
      or do musicians pay to be listed?"
```

User answers → parser fills remaining slots → moves to Stage 4.

---

### Stage 4: Slot Confirmation (always shown)

Before building anything, the parser shows the user a clean summary:

```
Here's what I'm building:

  App name:       HireAMusician
  Type:           Service Marketplace
  Sellers:        Musicians
  Buyers:         Event organizers
  Categories:     Weddings, Corporate, Birthdays, Festivals
  Platform fee:   12% per booking
  Key features:   Bookings calendar, Reviews, Messaging

  Extras I'll add based on your description:
  - Availability calendar for musicians
  - Sample audio upload (so buyers can preview)
  - Travel radius setting per musician

Looks right? Or want to change anything before I build?
```

User confirms → Assembler runs → repo spun up.

---

## Slot Extraction Logic

### Template Detection Keywords

```typescript
const TEMPLATE_SIGNALS = {
  marketplace: [
    'buy and sell', 'hire', 'book a', 'freelancer', 'marketplace',
    'list their', 'find a', 'connect buyers', 'platform for',
    'service provider', 'vendor', 'seller'
  ],
  saas: [
    'tool that', 'software for', 'dashboard', 'manage my',
    'automate', 'track', 'generate', 'subscription'
  ],
  directory: [
    'directory', 'list of', 'find a', 'resource hub',
    'database of', 'submit a listing', 'browse'
  ],
  community: [
    'forum', 'community', 'discuss', 'members', 'posts',
    'share', 'network', 'connect with others'
  ],
  ecommerce: [
    'sell products', 'online store', 'shop', 'cart',
    'physical products', 'ship', 'inventory'
  ],
  clientPortal: [
    'client portal', 'agency', 'project management',
    'share files with', 'update clients', 'coach'
  ],
  internalTool: [
    'internal', 'team dashboard', 'admin panel',
    'manage employees', 'ops tool', 'crm'
  ],
  contentMedia: [
    'blog', 'newsletter', 'course', 'podcast',
    'content', 'paywall', 'publish'
  ]
};
```

### Noun Extraction (seller/buyer/listing)

The parser uses an LLM call to extract domain nouns:

```typescript
const NOUN_EXTRACTION_PROMPT = `
From this app description, extract:
1. What is being offered/sold (listing_noun, singular)
2. Who offers/sells it (seller_noun, singular)  
3. Who buys/books it (buyer_noun, singular)
4. Suggested categories (array of 4-6 strings)

Description: "{USER_INPUT}"

Respond only in JSON:
{
  "listing_noun": "",
  "seller_noun": "",
  "buyer_noun": "",
  "categories": []
}
`;
```

### Business Model Inference

```typescript
function inferBusinessModel(description: string): BusinessModel {
  const hasCut = /commission|percentage|cut|fee per|take a/i.test(description);
  const hasSub = /subscription|monthly fee|pay to list|membership/i.test(description);
  
  if (hasCut) return { type: 'platform_cut', fee_percent: 10 }; // default, user confirms
  if (hasSub) return { type: 'subscription_to_list' };
  return { type: 'unknown' }; // triggers clarification question
}
```

---

## Full Slot Map (Marketplace)

```typescript
interface MarketplaceSlotMap {
  // Identity
  APP_NAME: string;               // AI-generated from description
  TAGLINE: string;                // One-line pitch
  HERO_COPY: string;              // Landing page H1

  // Domain nouns
  LISTING_NOUN: string;           // "gig" / "service" / "photographer"
  SELLER_NOUN: string;            // "freelancer" / "musician" / "host"
  BUYER_NOUN: string;             // "client" / "venue" / "organizer"

  // Content
  CATEGORIES: string[];           // Browse filter values
  LISTING_FIELDS: string[];       // Extra fields on listing form
  SCHEMA_EXTRAS: SchemaExtra[];   // Extra DB columns

  // Business model
  PLATFORM_FEE_PERCENT: number;   // Stripe Connect application fee
  CURRENCY: string;               // Default 'usd'

  // Design
  PRIMARY_COLOR: string;          // Hex — AI picks from description tone
  SECONDARY_COLOR: string;

  // Snippets to include
  SNIPPETS: SnippetKey[];         // Which pre-built modules to wire in
}
```

---

## Snippet Selection Logic

Parser automatically selects snippets based on description signals:

```typescript
function selectSnippets(description: string, template: TemplateType): SnippetKey[] {
  const snippets: SnippetKey[] = ['auth', 'stripe-connect']; // always for marketplace

  if (/review|rating|feedback/i.test(description)) snippets.push('reviews');
  if (/message|chat|contact|communicate/i.test(description)) snippets.push('messaging');
  if (/book|schedule|calendar|appointment|available/i.test(description)) snippets.push('bookings');
  if (/upload|portfolio|photo|sample|file/i.test(description)) snippets.push('file-upload');
  if (/search|filter|browse|find/i.test(description)) snippets.push('search-filter');
  if (/notify|alert|email|remind/i.test(description)) snippets.push('notifications');
  
  // admin-panel always included
  snippets.push('admin-panel');

  return snippets;
}
```

---

## App Name Generation

```typescript
const NAME_GENERATION_PROMPT = `
Generate a short, memorable app name for this marketplace:
"{USER_INPUT}"

Rules:
- 1-2 words maximum
- Memorable and domain-relevant
- Not already a major brand
- Can be a portmanteau or invented word

Return only the name, nothing else.
`;
```

---

## Full Parser API

```typescript
// POST /api/denovo/parse
interface ParseRequest {
  sessionId: string;        // Tracks conversation state
  message: string;          // User's latest message
  history: Message[];       // Full conversation so far
}

interface ParseResponse {
  stage: 'extracting' | 'clarifying' | 'confirming' | 'ready';
  message: string;          // What to show the user
  slots?: Partial<SlotMap>; // Current state of extracted slots
  template?: TemplateType;  // Selected template (once confident)
  ready: boolean;           // True = Assembler can run
}
```

---

## System Prompt (for the LLM powering the parser)

```
You are DeNovo's Intent Parser. Your job is to understand what app a user
wants to build and extract the information needed to spin it up from a template.

Rules:
- Ask ONE question at a time, never multiple at once
- Be conversational, not form-like
- Make smart assumptions and state them clearly
- Maximum 3 clarifying questions before confirming
- Always show a confirmation summary before building
- If the user's description is already detailed, skip straight to confirmation

You are extracting slots for a marketplace template with these variables:
APP_NAME, TAGLINE, LISTING_NOUN, SELLER_NOUN, BUYER_NOUN, CATEGORIES[],
LISTING_FIELDS[], PLATFORM_FEE_PERCENT, PRIMARY_COLOR, SNIPPETS[]

Current conversation: {HISTORY}
Current slot state: {SLOTS}
Missing slots: {MISSING}

Respond in JSON:
{
  "message": "What to say to the user",
  "slots": { ...any newly extracted slots },
  "ready": false
}
```

---

## Example: Full Conversation

```
User:    "I want a marketplace for African fashion designers to sell their work"

Parser:  "Love it — a marketplace for African fashion designers.
          
          Quick question: are buyers purchasing finished pieces
          (like clothing items), or are they commissioning custom designs?
          That changes how listings are structured."

User:    "Both — they can sell ready-made pieces and take custom orders"

Parser:  "Perfect. Does the platform take a cut of each sale,
          or do designers pay a monthly/annual fee to list?"

User:    "Platform takes 8%"

Parser:  "Here's what I'm building:

          App name:       AfriThread
          Type:           Product + Service Marketplace
          Sellers:        Designers
          Buyers:         Fashion shoppers
          Categories:     Ready-to-wear, Custom Orders, Accessories,
                          Fabrics, Home & Decor
          Platform fee:   8% per sale
          Key features:   File upload (portfolio + product photos),
                          Reviews, Messaging, Admin panel

          Extras:
          - Custom order request flow (buyer describes what they want)
          - Designer profile with country/region
          - Shipping/delivery options per listing

          Looks right?"

User:    "Yes, build it"

Parser:  → outputs complete SlotMap → Assembler runs → repo ready
```

---

## What the Parser Does NOT Do

- Does not write code
- Does not make infrastructure decisions
- Does not pick the tech stack (always Next.js + Supabase + Coolify + Stripe)
- Does not ask more than 3 clarifying questions
- Does not show the user the raw JSON slot map
