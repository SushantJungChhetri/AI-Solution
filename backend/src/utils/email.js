// backend/src/utils/email.js
import nodemailer from "nodemailer";

function asBool(v) {
  if (typeof v === "boolean") return v;
  if (v == null) return false;
  return String(v).toLowerCase() === "true";
}

const {
  EMAIL_HOST = "smtp.gmail.com",
  EMAIL_PORT = "587",                 // 587 (STARTTLS) or 465 (SMTPS)
  EMAIL_SECURE,                       // optional; we will infer from port if not set
  EMAIL_USER,
  EMAIL_PASS,                         // <-- use a Gmail App Password
  EMAIL_FROM,
  NODE_ENV,
} = process.env;

function resolveSecure(port, explicit) {
  if (explicit != null) return asBool(explicit);
  return String(port) === "465";      // secure:true for 465, false otherwise
}

function createTransport() {
  if (!EMAIL_USER || !EMAIL_PASS) {
    console.warn("[mail] EMAIL_USER/EMAIL_PASS missing. Email disabled.");
    return null;
  }

  const secure = resolveSecure(EMAIL_PORT, EMAIL_SECURE);

  return nodemailer.createTransport({
    host: EMAIL_HOST,
    port: Number(EMAIL_PORT) || 587,
    secure,                           // true for 465, false for 587
    auth: { user: EMAIL_USER, pass: EMAIL_PASS },
    requireTLS: !secure,              // STARTTLS path for 587
    pool: false,                      // IMPORTANT: avoid idle pooled sockets on Render
    connectionTimeout: 15_000,        // TCP connect timeout
    greetingTimeout: 10_000,          // wait for banner
    socketTimeout: 20_000,            // inactivity after connect
  });
}

let transporter = createTransport();

// DO NOT verify at startup—causes noisy "non-fatal: timeout" logs on hosts
// if (transporter && NODE_ENV !== "test") { ...transporter.verify()... }

function fromAddress() {
  // nice "Name <email@...>" if EMAIL_FROM provides only a name or address
  const from = EMAIL_FROM || EMAIL_USER || "no-reply@example.com";
  return /<.*@.*>/.test(from) || /@/.test(from) ? from : `"AI Solutions" <${EMAIL_USER}>`;
}

// tiny retry helper for transient network hiccups
async function withRetry(fn, attempts = 3) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try { return await fn(); }
    catch (e) {
      lastErr = e;
      // backoff: 0.5s, 1s, 1.5s
      await new Promise(r => setTimeout(r, (i + 1) * 500));
      // recreate transport if connection died
      transporter = createTransport();
    }
  }
  throw lastErr;
}

export async function sendOTP(email, otp) {
  console.log(`OTP for ${email}: ${otp} (expires in 10 minutes)`);

  if (!transporter) {
    console.warn("[mail] Email not configured; skipping OTP email");
    return { ok: false, error: "MAIL_NOT_CONFIGURED" };
  }

  const mailOptions = {
    from: fromAddress(),
    to: email,
    subject: "Your Admin Login OTP",
    text: `Your OTP code is: ${otp}. It expires in 10 minutes.`,
    html: `<p>Your OTP code is: <b>${otp}</b>. It expires in 10 minutes.</p>`,
  };

  try {
    const info = await withRetry(() => transporter.sendMail(mailOptions));
    console.log("[mail] OTP email sent:", info.messageId);
    return { ok: true };
  } catch (error) {
    console.error("[mail] OTP send failed:", error?.message || error);
    return { ok: false, error: "MAIL_SEND_FAILED" };
  }
}

export async function sendReply(toEmail, replyMessage, inquiryDetails) {
  if (!transporter) {
    console.warn("[mail] Email not configured; skipping reply email");
    return { ok: false, error: "MAIL_NOT_CONFIGURED" };
  }

  const subject = `Re: Your Inquiry - ${inquiryDetails.name}`;
  const text = `Dear ${inquiryDetails.name},\n\n${replyMessage}\n\nBest regards,\nAI Solutions Team`;
  const html = `
    <p>Dear ${inquiryDetails.name},</p>
    <p>${replyMessage.replace(/\n/g, "<br>")}</p>
    <p>Best regards,<br>AI Solutions Team</p>
  `;

  try {
    const info = await withRetry(() =>
      transporter.sendMail({ from: fromAddress(), to: toEmail, subject, text, html })
    );
    console.log("[mail] Reply email sent:", info.messageId);
    return { ok: true };
  } catch (error) {
    console.error("[mail] Reply send failed:", error?.message || error);
    return { ok: false, error: "MAIL_SEND_FAILED" };
  }
}
