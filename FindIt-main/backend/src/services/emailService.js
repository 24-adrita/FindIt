const nodemailer = require("nodemailer");

// Check if SMTP or Gmail credentials exist
const isSmtpConfigured = Boolean(
  (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) ||
  (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD)
);

let transporter = null;

if (isSmtpConfigured) {
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  } else {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  console.log("📧 [Email Service] SMTP Transporter initialized successfully.");
} else {
  console.log("📬 [Email Service] SMTP not configured — running in graceful Mock / Console Log mode.");
}

const FROM_SENDER = process.env.EMAIL_FROM || '"FindIt Sylhet Network" <noreply@findit-sylhet.edu>';

/**
 * Core email sender with graceful mock fallback
 */
async function sendMail({ to, subject, html, text }) {
  if (!to) {
    return { success: false, reason: "No recipient specified." };
  }

  // Fallback: If not configured, print beautiful log in console without error
  if (!transporter) {
    console.log(`\n================== 📬 [FINDIT EMAIL MOCK] ==================`);
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Date:    ${new Date().toISOString()}`);
    console.log(`Body:    ${text || "(HTML Content Preview Rendered)"}`);
    console.log(`============================================================\n`);
    return { success: true, mocked: true };
  }

  try {
    const info = await transporter.sendMail({
      from: FROM_SENDER,
      to,
      subject,
      text: text || "Please open this email in an HTML-compatible client.",
      html,
    });
    console.log(`✅ [Email Service] Dispatched email to ${to} (MessageId: ${info.messageId})`);
    return { success: true, messageId: info.messageId, mocked: false };
  } catch (err) {
    console.warn(`⚠️ [Email Service] Failed to send email to ${to}:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Base email layout wrapper with Graphite & Emerald branding
 */
function wrapHtmlTemplate({ title, badge, contentHtml, callToAction }) {
  const currentYear = new Date().getFullYear();
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f1210; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #F3F4EF;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0f1210; padding: 40px 15px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table role="presentation" width="100%" style="max-width: 560px; background-color: #171B18; border: 1px solid #2C342E; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          
          <!-- Top Accent Bar -->
          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, #2E8B65, #45B58A, #6EE7B7);"></td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="padding: 30px 35px 20px 35px;">
              <table width="100%">
                <tr>
                  <td>
                    <div style="font-size: 22px; font-weight: 800; letter-spacing: -0.5px; color: #FFFFFF;">
                      Find<span style="color: #45B58A;">It</span>
                    </div>
                    <div style="font-size: 11px; color: #8F9992; text-transform: uppercase; letter-spacing: 1px; margin-top: 2px;">
                      Sylhet Metropolitan & Campus Network
                    </div>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; padding: 4px 10px; font-size: 11px; font-weight: 700; border-radius: 20px; background-color: rgba(69, 181, 138, 0.15); color: #45B58A; border: 1px solid rgba(69, 181, 138, 0.3);">
                      ${badge || "Security Alert"}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 0 35px;"><div style="height: 1px; background-color: #262D28;"></div></td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 25px 35px; font-size: 14px; line-height: 1.6; color: #D1D5DB;">
              ${contentHtml}

              ${callToAction ? `
              <div style="margin-top: 30px; text-align: center;">
                <a href="${callToAction.url}" style="display: inline-block; background-color: #45B58A; color: #0F1210; font-weight: 700; font-size: 13px; text-decoration: none; padding: 12px 28px; border-radius: 8px; box-shadow: 0 4px 15px rgba(69, 181, 138, 0.3);">
                  ${callToAction.text}
                </a>
              </div>
              ` : ""}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 35px; background-color: #121513; border-top: 1px solid #242A25; font-size: 11px; color: #737D76; text-align: center;">
              This is an automated notification from the FindIt Lost & Found System.<br/>
              Developed for Sylhet Metropolitan University & Sylhet City &copy; ${currentYear} FindIt.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * 1. Notification for Claim Status Update (Approved / Rejected)
 */
async function sendClaimStatusEmail({ to, recipientName, itemTitle, status, reviewNotes, viewLink }) {
  const isApproved = status === "approved";
  const statusColor = isApproved ? "#45B58A" : "#EF4444";
  const badgeText = isApproved ? "CLAIM APPROVED" : "CLAIM REJECTED";

  const contentHtml = `
    <h2 style="color: #FFFFFF; font-size: 18px; margin-top: 0; margin-bottom: 12px;">
      Hello ${recipientName || "Citizen"},
    </h2>
    <p>
      Your ownership claim for the item <strong>"${itemTitle}"</strong> has been reviewed by the verification desk.
    </p>

    <div style="background-color: #1E2420; border-left: 4px solid ${statusColor}; padding: 16px; border-radius: 6px; margin: 20px 0;">
      <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: ${statusColor}; font-weight: 700; margin-bottom: 4px;">
        Review Decision: ${badgeText}
      </div>
      <div style="font-size: 13px; color: #E5E7EB;">
        ${reviewNotes || (isApproved ? "Please bring your ID card (NID / Student ID) to the designated verification desk to collect your item." : "Ownership proof could not be verified.")}
      </div>
    </div>

    ${isApproved ? `
    <p style="font-size: 13px; color: #9CA3AF;">
      <strong>Next Step:</strong> Visit the designated verification desk during operational hours with your identification card (NID or Student ID).
    </p>
    ` : ""}
  `;

  return sendMail({
    to,
    subject: `[FindIt] Your Ownership Claim has been ${isApproved ? "Approved" : "Updated"} (${itemTitle})`,
    html: wrapHtmlTemplate({
      title: `Claim ${isApproved ? "Approved" : "Reviewed"}`,
      badge: badgeText,
      contentHtml,
      callToAction: viewLink ? { text: "View Claim Status in Portal", url: viewLink } : null,
    }),
    text: `Hello ${recipientName},\nYour claim for "${itemTitle}" has been ${status}.\nNotes: ${reviewNotes}\nStatus: ${status}`,
  });
}

/**
 * 2. Notification for AI High-Confidence Match
 */
async function sendMatchAlertEmail({ to, recipientName, lostItemTitle, matchScore, foundItemTitle, viewLink }) {
  const scorePercent = Math.round(matchScore >= 1 ? matchScore : matchScore * 100);

  const contentHtml = `
    <h2 style="color: #FFFFFF; font-size: 18px; margin-top: 0; margin-bottom: 12px;">
      Good news, ${recipientName || "there"}!
    </h2>
    <p>
      Our Multimodal AI Engine has detected a potential match for your lost item <strong>"${lostItemTitle}"</strong>.
    </p>

    <div style="background-color: #1E2420; border: 1px solid #2E3832; padding: 18px; border-radius: 8px; margin: 20px 0;">
      <table width="100%">
        <tr>
          <td>
            <div style="font-size: 11px; text-transform: uppercase; color: #8F9992;">Found Item Candidate</div>
            <div style="font-size: 15px; font-weight: 700; color: #FFFFFF; margin-top: 2px;">${foundItemTitle}</div>
          </td>
          <td align="right">
            <div style="font-size: 20px; font-weight: 800; color: #45B58A;">${scorePercent}%</div>
            <div style="font-size: 10px; color: #8F9992; text-transform: uppercase;">Confidence</div>
          </td>
        </tr>
      </table>
    </div>

    <p style="font-size: 13px; color: #9CA3AF;">
      Review the visual, semantic, and location details in the FindIt portal to verify if this belongs to you and submit an ownership claim.
    </p>
  `;

  return sendMail({
    to,
    subject: `[FindIt] Potential AI Match Found (${scorePercent}% Match for "${lostItemTitle}")`,
    html: wrapHtmlTemplate({
      title: "Potential AI Match Detected",
      badge: `${scorePercent}% AI MATCH`,
      contentHtml,
      callToAction: viewLink ? { text: "Review Match & Claim", url: viewLink } : null,
    }),
    text: `Hello ${recipientName},\nWe found a ${scorePercent}% match for your lost item "${lostItemTitle}": "${foundItemTitle}".\nPlease visit the FindIt portal to review and claim it.`,
  });
}

/**
 * 3. Report Submission Confirmation
 */
async function sendReportConfirmationEmail({ to, recipientName, itemTitle, type, viewLink }) {
  const isLost = (type || "").toLowerCase() === "lost";

  const contentHtml = `
    <h2 style="color: #FFFFFF; font-size: 18px; margin-top: 0; margin-bottom: 12px;">
      Report Received, ${recipientName || "Friend"}!
    </h2>
    <p>
      Your report for <strong>"${itemTitle}"</strong> has been successfully registered on the FindIt network.
    </p>

    <div style="background-color: #1E2420; border: 1px solid #2E3832; padding: 14px 18px; border-radius: 8px; margin: 20px 0; font-size: 13px;">
      <strong>Report Category:</strong> ${isLost ? "Lost Item Report" : "Found Item Report"}<br/>
      <strong>Network Status:</strong> Active across Sylhet Metropolitan Hubs & Campuses<br/>
      <strong>AI Scanning:</strong> Continuous automated multimodal cross-matching enabled.
    </div>

    <p style="font-size: 13px; color: #9CA3AF;">
      ${isLost
        ? "We will automatically notify you as soon as a matching item is reported on campus or around the city."
        : "Thank you for being a responsible citizen. We will notify you when the verified owner claims it."}
    </p>
  `;

  return sendMail({
    to,
    subject: `[FindIt] Confirmation: ${isLost ? "Lost" : "Found"} Item Report Registered (${itemTitle})`,
    html: wrapHtmlTemplate({
      title: "Report Registered",
      badge: isLost ? "LOST ITEM REGISTERED" : "FOUND ITEM REGISTERED",
      contentHtml,
      callToAction: viewLink ? { text: "View Report in Portal", url: viewLink } : null,
    }),
    text: `Hello ${recipientName},\nYour ${isLost ? "lost" : "found"} item report for "${itemTitle}" has been received and registered on the FindIt network.`,
  });
}

module.exports = {
  isSmtpConfigured,
  sendMail,
  sendClaimStatusEmail,
  sendMatchAlertEmail,
  sendReportConfirmationEmail,
};
