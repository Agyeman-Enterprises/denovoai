export function welcomeEmail(name: string): { subject: string; html: string } {
  return {
    subject: "Welcome to the platform",
    html: `<div style="font-family:system-ui;max-width:600px;margin:0 auto;padding:40px 20px">
      <h1 style="font-size:24px">Welcome, ${name}!</h1>
      <p style="color:#666;line-height:1.6">Your account has been created. You can start using the platform right away.</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="display:inline-block;margin-top:20px;padding:12px 24px;background:#8B5CF6;color:white;text-decoration:none;border-radius:8px">Go to Dashboard</a>
    </div>`,
  };
}

export function orderConfirmationEmail(orderId: string, amount: string): { subject: string; html: string } {
  return {
    subject: `Order Confirmed — ${orderId}`,
    html: `<div style="font-family:system-ui;max-width:600px;margin:0 auto;padding:40px 20px">
      <h1 style="font-size:24px">Order Confirmed</h1>
      <p style="color:#666">Order ID: <strong>${orderId}</strong></p>
      <p style="color:#666">Amount: <strong>${amount}</strong></p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="display:inline-block;margin-top:20px;padding:12px 24px;background:#8B5CF6;color:white;text-decoration:none;border-radius:8px">View Order</a>
    </div>`,
  };
}

export function passwordResetEmail(resetUrl: string): { subject: string; html: string } {
  return {
    subject: "Reset your password",
    html: `<div style="font-family:system-ui;max-width:600px;margin:0 auto;padding:40px 20px">
      <h1 style="font-size:24px">Reset Your Password</h1>
      <p style="color:#666">Click below to reset your password. This link expires in 1 hour.</p>
      <a href="${resetUrl}" style="display:inline-block;margin-top:20px;padding:12px 24px;background:#8B5CF6;color:white;text-decoration:none;border-radius:8px">Reset Password</a>
    </div>`,
  };
}
