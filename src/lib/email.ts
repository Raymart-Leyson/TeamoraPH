import nodemailer from "nodemailer";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://teamoraph.selleruniverse.com";
const FROM = `TeamoraPH <${process.env.GMAIL_USER ?? "no-reply@teamoraph.com"}>`;

function getTransporter() {
    const user = process.env.GMAIL_USER;
    const pass = process.env.GMAIL_APP_PASSWORD;
    if (!user || !pass) return null;

    return nodemailer.createTransport({
        service: "gmail",
        auth: { user, pass },
    });
}

// ─── Templates ────────────────────────────────────────────────────────────────

function baseTemplate(content: string) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>TeamoraPH</title>
</head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.07);">
          <!-- Header -->
          <tr>
            <td style="background:#3D6EFF;padding:24px 32px;">
              <span style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">
                Teamora<span style="color:#bcd0ff;">PH</span>
              </span>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;background:#f8f9fc;border-top:1px solid #eaecf0;">
              <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
                You received this email because you have an account on
                <a href="${APP_URL}" style="color:#3D6EFF;text-decoration:none;">TeamoraPH</a>.
                <br/>To manage your notifications, visit your
                <a href="${APP_URL}/notifications" style="color:#3D6EFF;text-decoration:none;">notifications settings</a>.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function newMessageHtml(senderName: string, preview: string, conversationUrl: string) {
    return baseTemplate(`
      <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#111827;">You have a new message</h2>
      <p style="margin:0 0 20px;font-size:15px;color:#6b7280;">
        <strong style="color:#111827;">${senderName}</strong> sent you a message on TeamoraPH.
      </p>
      <div style="background:#f4f6fb;border-left:3px solid #3D6EFF;border-radius:6px;padding:14px 18px;margin-bottom:24px;">
        <p style="margin:0;font-size:14px;color:#374151;font-style:italic;">"${preview}"</p>
      </div>
      <a href="${conversationUrl}"
         style="display:inline-block;background:#3D6EFF;color:#ffffff;font-size:14px;font-weight:600;
                text-decoration:none;padding:12px 28px;border-radius:8px;">
        View Message
      </a>
    `);
}

function applicationStatusHtml(jobTitle: string, newStatus: string, applicationsUrl: string) {
    const statusColors: Record<string, string> = {
        shortlisted: "#16a34a",
        interviewing: "#2563eb",
        hired: "#059669",
        rejected: "#dc2626",
        pending: "#d97706",
    };
    const color = statusColors[newStatus.toLowerCase()] ?? "#6b7280";

    return baseTemplate(`
      <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#111827;">Application Update</h2>
      <p style="margin:0 0 20px;font-size:15px;color:#6b7280;">
        Your application for <strong style="color:#111827;">${jobTitle}</strong> has been updated.
      </p>
      <div style="background:#f4f6fb;border-radius:8px;padding:16px 20px;margin-bottom:24px;display:inline-block;">
        <p style="margin:0 0 4px;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">New Status</p>
        <span style="font-size:18px;font-weight:700;color:${color};">
          ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}
        </span>
      </div>
      <br/>
      <a href="${applicationsUrl}"
         style="display:inline-block;background:#3D6EFF;color:#ffffff;font-size:14px;font-weight:600;
                text-decoration:none;padding:12px 28px;border-radius:8px;">
        View Application
      </a>
    `);
}

// ─── Send helpers ──────────────────────────────────────────────────────────────

export async function sendNewMessageEmail({
    toEmail,
    toName,
    senderName,
    messagePreview,
    conversationId,
    recipientRole,
}: {
    toEmail: string;
    toName: string;
    senderName: string;
    messagePreview: string;
    conversationId: string;
    recipientRole: "candidate" | "employer";
}) {
    const transporter = getTransporter();
    if (!transporter) return;

    const conversationUrl = `${APP_URL}/${recipientRole}/messages/${conversationId}`;
    const preview = messagePreview.length > 120 ? messagePreview.slice(0, 117) + "..." : messagePreview;

    await transporter.sendMail({
        from: FROM,
        to: toEmail,
        subject: `${senderName} sent you a message — TeamoraPH`,
        html: newMessageHtml(senderName, preview, conversationUrl),
    });
}

export async function sendApplicationStatusEmail({
    toEmail,
    jobTitle,
    newStatus,
}: {
    toEmail: string;
    jobTitle: string;
    newStatus: string;
}) {
    const transporter = getTransporter();
    if (!transporter) return;

    const applicationsUrl = `${APP_URL}/candidate/applications`;

    await transporter.sendMail({
        from: FROM,
        to: toEmail,
        subject: `Your application for "${jobTitle}" has been updated — TeamoraPH`,
        html: applicationStatusHtml(jobTitle, newStatus, applicationsUrl),
    });
}
