// Email transactional client
// In production, use Resend, SendGrid, or AWS SES
// This is a reference implementation with a pluggable interface

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}

export async function sendEmail(payload: EmailPayload): Promise<{ success: boolean; id?: string; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log("[EMAIL STUB]", payload.to, payload.subject);
    return { success: true, id: "stub_" + Date.now() };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: payload.from || process.env.EMAIL_FROM || "noreply@example.com",
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      reply_to: payload.replyTo,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return { success: false, error: err };
  }

  const data = await res.json();
  return { success: true, id: data.id };
}
