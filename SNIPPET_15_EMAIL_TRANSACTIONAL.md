# DeNovo — Email Transactional Snippet Brief
## Resend. Welcome emails, receipts, notifications, password reset.
## Adds to existing harness on port 6001.

---

## 🚨 CLOUDFLARE — ABSOLUTE NO-TOUCH ZONE
NEVER touch Cloudflare, DNS, tunnels, Traefik. Add to port 6001. Stop there.

---

## Dependencies to Install
```bash
npm install resend react-email @react-email/components
```

---

## What This Adds

Transactional email via Resend. React Email templates.
Covers every email an app sends to users.

---

## Environment Variables (add to existing)
```bash
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@yourdomain.com     # Must be verified in Resend
EMAIL_REPLY_TO=support@yourdomain.com
```

---

## File Structure to Add

```
src/
├── app/
│   └── api/
│       └── email/
│           └── route.ts              # Send email endpoint (admin only)
└── lib/
    └── email/
        ├── client.ts                 # Resend client
        ├── send.ts                   # Core send function
        └── templates/
            ├── WelcomeEmail.tsx      # New user welcome
            ├── ReceiptEmail.tsx      # Purchase receipt
            ├── BookingEmail.tsx      # Booking confirmation
            ├── MessageEmail.tsx      # New message notification
            ├── ResetEmail.tsx        # Password reset (if needed)
            └── NotificationEmail.tsx # Generic notification
```

---

## Implementation Details

### `src/lib/email/client.ts`
```typescript
import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY!)
```

### `src/lib/email/send.ts`
```typescript
import { resend } from './client'
import type { ReactElement } from 'react'

interface SendEmailOptions {
  to: string | string[]
  subject: string
  react: ReactElement
  replyTo?: string
}

export async function sendEmail({
  to,
  subject,
  react,
  replyTo,
}: SendEmailOptions) {
  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to: Array.isArray(to) ? to : [to],
    reply_to: replyTo ?? process.env.EMAIL_REPLY_TO,
    subject,
    react,
  })

  if (error) {
    console.error('[Email Error]', error)
    throw new Error(error.message)
  }

  return data
}

// Convenience functions — call these from your app logic
export async function sendWelcomeEmail(user: { email: string; name?: string }) {
  const { WelcomeEmail } = await import('./templates/WelcomeEmail')
  return sendEmail({
    to: user.email,
    subject: 'Welcome to {{APP_NAME}}',
    react: WelcomeEmail({ name: user.name ?? user.email }),
  })
}

export async function sendReceiptEmail(opts: {
  to: string
  orderId: string
  amount: number
  items: { name: string; price: number }[]
}) {
  const { ReceiptEmail } = await import('./templates/ReceiptEmail')
  return sendEmail({
    to: opts.to,
    subject: `Your receipt from {{APP_NAME}}`,
    react: ReceiptEmail(opts),
  })
}

export async function sendBookingConfirmationEmail(opts: {
  to: string
  bookingId: string
  date: string
  time: string
  listingTitle: string
}) {
  const { BookingEmail } = await import('./templates/BookingEmail')
  return sendEmail({
    to: opts.to,
    subject: 'Booking confirmed',
    react: BookingEmail(opts),
  })
}

export async function sendNewMessageEmail(opts: {
  to: string
  senderName: string
  preview: string
  conversationUrl: string
}) {
  const { MessageEmail } = await import('./templates/MessageEmail')
  return sendEmail({
    to: opts.to,
    subject: `New message from ${opts.senderName}`,
    react: MessageEmail(opts),
  })
}
```

### `src/lib/email/templates/WelcomeEmail.tsx`
```typescript
import {
  Html, Head, Body, Container, Text, Button, Hr
} from '@react-email/components'

export function WelcomeEmail({ name }: { name: string }) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f9f9f9' }}>
        <Container style={{ maxWidth: '560px', margin: '0 auto', padding: '40px 20px' }}>
          <Text style={{ fontSize: '24px', fontWeight: 'bold' }}>
            Welcome to {{APP_NAME}}
          </Text>
          <Text style={{ color: '#444' }}>
            Hi {name}, you're in. Here's what to do next.
          </Text>
          <Button
            href={`${process.env.NEXT_PUBLIC_APP_URL}/dashboard`}
            style={{
              backgroundColor: '#8B5CF6',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '6px',
              textDecoration: 'none',
            }}
          >
            Go to Dashboard
          </Button>
          <Hr />
          <Text style={{ fontSize: '12px', color: '#999' }}>
            If you didn't sign up, ignore this email.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
```

### `src/lib/email/templates/ReceiptEmail.tsx`
```typescript
import { Html, Head, Body, Container, Text, Hr, Row, Column } from '@react-email/components'

export function ReceiptEmail({
  orderId,
  amount,
  items,
}: {
  orderId: string
  amount: number
  items: { name: string; price: number }[]
}) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f9f9f9' }}>
        <Container style={{ maxWidth: '560px', margin: '0 auto', padding: '40px 20px' }}>
          <Text style={{ fontSize: '24px', fontWeight: 'bold' }}>Receipt</Text>
          <Text>Order #{orderId.slice(0, 8).toUpperCase()}</Text>
          <Hr />
          {items.map((item, i) => (
            <Row key={i}>
              <Column>{item.name}</Column>
              <Column style={{ textAlign: 'right' }}>
                ${(item.price / 100).toFixed(2)}
              </Column>
            </Row>
          ))}
          <Hr />
          <Row>
            <Column><strong>Total</strong></Column>
            <Column style={{ textAlign: 'right' }}>
              <strong>${(amount / 100).toFixed(2)}</strong>
            </Column>
          </Row>
        </Container>
      </Body>
    </Html>
  )
}
```

### Wire into Supabase Auth hook (send welcome on signup)
```typescript
// In the handle_new_user trigger or in your auth callback route
// After user is confirmed, call:
await sendWelcomeEmail({ email: user.email, name: user.user_metadata?.full_name })
```

---

## Verification Checklist
- [ ] Resend API key connects successfully
- [ ] Welcome email sends and lands in inbox (not spam)
- [ ] Receipt email renders correctly with items table
- [ ] Booking confirmation email sends
- [ ] Message notification email sends
- [ ] Emails render correctly on mobile
- [ ] FROM address matches verified Resend domain
- [ ] `npm run build` passes clean

---

## When Done — Report Exactly
1. ✅/❌ Resend client connects
2. ✅/❌ Welcome email sends and arrives
3. ✅/❌ Receipt email renders with correct data
4. ✅/❌ All 4 template types build without errors
5. ✅/❌ `npm run build` passes clean
