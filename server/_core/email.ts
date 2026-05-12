import { Resend } from "resend";
import { ENV } from "./env";

let _resend: Resend | null = null;

function getResend(): Resend | null {
  if (!ENV.resendApiKey) return null;
  if (!_resend) _resend = new Resend(ENV.resendApiKey);
  return _resend;
}

export async function sendVerificationEmail(to: string, token: string): Promise<void> {
  const resend = getResend();
  if (!resend) {
    console.log(`[Email] Verification token for ${to}: ${token} (Resend not configured)`);
    return;
  }
  const url = `${ENV.appUrl}/api/auth/verify-email?token=${token}`;
  await resend.emails.send({
    from: ENV.emailFrom,
    to,
    subject: "Verify your email — WhatsApp Pitch Builder",
    html: `
      <p>Click the link below to verify your email address:</p>
      <p><a href="${url}">${url}</a></p>
      <p>This link expires in 24 hours.</p>
    `,
  });
}

export async function sendPasswordResetEmail(to: string, token: string): Promise<void> {
  const resend = getResend();
  if (!resend) {
    console.log(`[Email] Password reset token for ${to}: ${token} (Resend not configured)`);
    return;
  }
  const url = `${ENV.appUrl}/reset-password?token=${token}`;
  await resend.emails.send({
    from: ENV.emailFrom,
    to,
    subject: "Reset your password — WhatsApp Pitch Builder",
    html: `
      <p>Click the link below to reset your password:</p>
      <p><a href="${url}">${url}</a></p>
      <p>This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>
    `,
  });
}
