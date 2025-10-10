// backend/src/utils/email.js
import { Resend } from "resend";

const {
  RESEND_API_KEY,
  RESEND_FROM,        
  EMAIL_FROM,         
} = process.env;

let resend = null;
if (!RESEND_API_KEY) {
  console.warn("[mail] RESEND_API_KEY missing. Email disabled.");
} else {
  resend = new Resend(RESEND_API_KEY);
}

function fromAddress() {
  return RESEND_FROM || EMAIL_FROM || "aisolution@resend.dev";
}

export async function sendOTP(email, otp) {
  console.log(`OTP for ${email}: ${otp} (expires in 10 minutes)`);

  if (!resend) {
    console.warn("[mail] Email not configured; skipping OTP email");
    return { ok: false, error: "MAIL_NOT_CONFIGURED" };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: `AI Solutions <${fromAddress()}>`,
      to: email,
      subject: "Your Admin Login OTP",
      html: `<p>Your OTP code is <b>${otp}</b>. It expires in 10 minutes.</p>`,
      text: `Your OTP code is: ${otp}. It expires in 10 minutes.`,
    });

    if (error) throw new Error(error.message || String(error));
    console.log("[mail] OTP email sent:", data?.id);
    return { ok: true };
  } catch (err) {
    console.error("[mail] OTP send failed:", err?.message || err);
    return { ok: false, error: "MAIL_SEND_FAILED" };
  }
}

export async function sendReply(toEmail, replyMessage, inquiryDetails) {
  if (!resend) {
    console.warn("[mail] Email not configured; skipping reply email");
    return { ok: false, error: "MAIL_NOT_CONFIGURED" };
  }

  const subject = `Re: Your Inquiry - ${inquiryDetails?.name ?? "AI Solutions"}`;
  const text = `Dear ${inquiryDetails?.name ?? "Customer"},\n\n${replyMessage}\n\nBest regards,\nAI Solutions Team`;
  const html = `
    <p>Dear ${inquiryDetails?.name ?? "Customer"},</p>
    <p>${(replyMessage || "").replace(/\n/g, "<br>")}</p>
    <p>Best regards,<br>AI Solutions Team</p>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: `AI Solutions <${fromAddress()}>`,
      to: toEmail,
      subject,
      text,
      html,
    });

    if (error) throw new Error(error.message || String(error));
    console.log("[mail] Reply email sent:", data?.id);
    return { ok: true };
  } catch (err) {
    console.error("[mail] Reply send failed:", err?.message || err);
    return { ok: false, error: "MAIL_SEND_FAILED" };
  }
}
