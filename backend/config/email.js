import nodemailer from 'nodemailer';

/**
 * Creates and returns a Nodemailer transporter.
 * If SMTP credentials are not set, returns null and logs a warning.
 * The system will NOT crash if email is unconfigured.
 */
const createTransporter = () => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.warn('[EMAIL] SMTP not configured — email alerts will be logged but not sent.');
    return null;
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT, 10) || 587,
    secure: parseInt(SMTP_PORT, 10) === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  console.log(`[EMAIL] SMTP transporter configured: ${SMTP_HOST}:${SMTP_PORT}`);

  // Verify SMTP credentials once on startup (non-blocking)
  transporter.verify()
    .then(() => console.log('[EMAIL] ✅ SMTP credentials verified successfully'))
    .catch((err) => {
      console.warn(`[EMAIL] ⚠️  SMTP auth failed: ${err.message}`);
      console.warn('[EMAIL] ⚠️  Email alerts disabled. Fix SMTP_USER/SMTP_PASS in .env (Gmail requires App Passwords).');
      smtpDisabled = true;
    });

  return transporter;
};

let transporter = null;
let smtpDisabled = false;

/**
 * Get the singleton transporter instance (lazy-initialized).
 */
export const getTransporter = () => {
  if (transporter === null) {
    transporter = createTransporter();
  }
  return smtpDisabled ? null : transporter;
};

/**
 * Send an alert email. Fails gracefully if SMTP is not configured.
 * @param {Object} options - { to, subject, html }
 * @returns {Promise<boolean>} true if sent, false otherwise
 */
export const sendAlertEmail = async ({ to, subject, html }) => {
  const t = getTransporter();
  if (!t) {
    // Silent log — don't spam console for every alert when SMTP is down
    return false;
  }

  try {
    const from = process.env.SMTP_FROM || 'aquasentinel@noreply.com';
    await t.sendMail({ from, to, subject, html });
    console.log(`[EMAIL] Alert email sent: "${subject}" to ${to}`);
    return true;
  } catch (error) {
    console.error(`[EMAIL] Failed to send email: ${error.message}`);
    // If auth fails at runtime, disable to prevent further attempts
    if (error.responseCode === 535 || error.code === 'EAUTH') {
      console.warn('[EMAIL] ⚠️  Disabling SMTP due to auth failure. Fix credentials in .env.');
      smtpDisabled = true;
    }
    return false;
  }
};

export default { getTransporter, sendAlertEmail };

