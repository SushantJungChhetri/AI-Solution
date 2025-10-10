// backend/src/utils/email.js
import nodemailer from "nodemailer";

function asBool(v) {
  if (typeof v === "boolean") return v;
  if (v == null) return false;
  return String(v).toLowerCase() === "true";
}

const {
  EMAIL_HOST = "smtp.gmail.com",
  EMAIL_PORT = "587",                 
  EMAIL_SECURE = "false",             
  EMAIL_USER,
  EMAIL_PASS,
  EMAIL_FROM,                        
  NODE_ENV,
} = process.env;

let transporter = null;

if (!EMAIL_USER || !EMAIL_PASS) {
  console.warn(
    "[mail] EMAIL_USER/EMAIL_PASS missing. Email disabled. " +
      "For Gmail, create a 16-char App Password and put it in EMAIL_PASS."
  );
} else {
  transporter = nodemailer.createTransport({
    host: EMAIL_HOST,
    port: Number(EMAIL_PORT) || 587,
    secure: asBool(EMAIL_SECURE),     
    auth: { user: EMAIL_USER, pass: EMAIL_PASS },
    requireTLS: true,                
    pool: true,                       
    connectionTimeout: 30000,        
    greetingTimeout: 20000,
    socketTimeout: 40000,
  });


  if (NODE_ENV !== "test") {
    setTimeout(() => {
      transporter
        .verify()
        .then(() => console.log("[mail] SMTP verified"))
        .catch((err) =>
          console.warn("[mail] SMTP verify failed (non-fatal):", err?.message || err)
        );
    }, 0);
  }
}

function fromAddress() {
  return EMAIL_FROM || EMAIL_USER || "no-reply@example.com";
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
    const info = await transporter.sendMail(mailOptions);
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
    const info = await transporter.sendMail({
      from: fromAddress(),
      to: toEmail,
      subject,
      text,
      html,
    });
    console.log("[mail] Reply email sent:", info.messageId);
    return { ok: true };
  } catch (error) {
    console.error("[mail] Reply send failed:", error?.message || error);
    return { ok: false, error: "MAIL_SEND_FAILED" };
  }
}
