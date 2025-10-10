// src/lib/email.js (or wherever you keep it)
import nodemailer from 'nodemailer';

function asBool(v) {
  if (typeof v === 'boolean') return v;
  if (v == null) return false;
  return String(v).toLowerCase() === 'true';
}

const {
  EMAIL_HOST = 'smtp.gmail.com',
  EMAIL_PORT = '587',
  EMAIL_SECURE = 'false',         // 'true' for 465, 'false' for 587
  EMAIL_USER,
  EMAIL_PASS,
  EMAIL_FROM,                     // optional nice display name
  NODE_ENV
} = process.env;

let transporter = null;

if (!EMAIL_USER || !EMAIL_PASS) {
  console.warn('[mail] EMAIL_USER/EMAIL_PASS missing. Email functionality disabled. For Gmail, create a 16-char App Password and put it in EMAIL_PASS.');
} else {
  transporter = nodemailer.createTransport({
    host: EMAIL_HOST,
    port: Number(EMAIL_PORT),
    secure: asBool(EMAIL_SECURE),    // true -> 465 SSL, false -> 587 STARTTLS
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });

  if (NODE_ENV !== 'test') {
    transporter.verify()
      .then(() => console.log('[mail] SMTP verified'))
      .catch(err => console.error('[mail] SMTP verify failed:', err?.message || err));
  }
}

export const sendOTP = async (email, otp) => {
  // For dev you can keep this log; remove in prod
  console.log(`OTP for ${email}: ${otp} (expires in 10 minutes)`);

  if (!transporter) {
    console.warn('[mail] Email not configured, skipping OTP email');
    return;
  }

  const from = EMAIL_FROM || EMAIL_USER;

  const mailOptions = {
    from,
    to: email,
    subject: 'Your Admin Login OTP',
    text: `Your OTP code is: ${otp}. It expires in 10 minutes.`,
    html: `<p>Your OTP code is: <b>${otp}</b>. It expires in 10 minutes.</p>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('OTP email sent to', email);
  } catch (error) {
    console.error('Error sending OTP email:', error?.message || error);
    throw error;
  }
};

export const sendReply = async (toEmail, replyMessage, inquiryDetails) => {
  if (!transporter) {
    console.warn('[mail] Email not configured, skipping reply email');
    return;
  }

  const from = EMAIL_FROM || EMAIL_USER;

  const subject = `Re: Your Inquiry - ${inquiryDetails.name}`;
  const text = `Dear ${inquiryDetails.name},\n\n${replyMessage}\n\nBest regards,\nAI Solutions Team`;
  const html = `
    <p>Dear ${inquiryDetails.name},</p>
    <p>${replyMessage.replace(/\n/g, '<br>')}</p>
    <p>Best regards,<br>AI Solutions Team</p>
  `;

  const mailOptions = {
    from,
    to: toEmail,
    subject,
    text,
    html,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Reply email sent to', toEmail);
  } catch (error) {
    console.error('Error sending reply email:', error?.message || error);
    throw error;
  }
};
