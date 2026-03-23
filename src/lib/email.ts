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

function welcomeHtml(name: string, role: "candidate" | "employer", appUrl: string) {
    const isEmployer = role === "employer";
    const ctaUrl = isEmployer ? `${appUrl}/employer/dashboard` : `${appUrl}/candidate/dashboard`;
    const ctaText = isEmployer ? "Go to Dashboard" : "Complete Your Profile";
    const bodyText = isEmployer
        ? `Start posting jobs, searching for talent, and building your team on TeamoraPH.`
        : `Complete your profile to start applying for jobs and getting noticed by top employers.`;

    return baseTemplate(`
      <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#111827;">Welcome to TeamoraPH${name ? `, ${name}` : ""}! 🎉</h2>
      <p style="margin:0 0 20px;font-size:15px;color:#6b7280;">${bodyText}</p>
      <a href="${ctaUrl}"
         style="display:inline-block;background:#3D6EFF;color:#ffffff;font-size:14px;font-weight:600;
                text-decoration:none;padding:12px 28px;border-radius:8px;">
        ${ctaText}
      </a>
    `);
}

function adminNewJobReviewHtml(jobTitle: string, employerEmail: string, reviewUrl: string) {
    return baseTemplate(`
      <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#111827;">New Job Post Pending Review</h2>
      <p style="margin:0 0 20px;font-size:15px;color:#6b7280;">
        A job post has been submitted and is waiting for your review.
      </p>
      <div style="background:#f4f6fb;border-left:3px solid #f59e0b;border-radius:6px;padding:14px 18px;margin-bottom:24px;">
        <p style="margin:0 0 6px;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">Job Title</p>
        <p style="margin:0 0 12px;font-size:15px;font-weight:600;color:#111827;">${jobTitle}</p>
        <p style="margin:0 0 4px;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">Submitted By</p>
        <p style="margin:0;font-size:14px;color:#374151;">${employerEmail}</p>
      </div>
      <a href="${reviewUrl}"
         style="display:inline-block;background:#f59e0b;color:#ffffff;font-size:14px;font-weight:600;
                text-decoration:none;padding:12px 28px;border-radius:8px;">
        Review Job Post
      </a>
    `);
}

function adminNewUserHtml(userEmail: string, role: string, dashboardUrl: string) {
    const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);
    const roleColor = role === "employer" ? "#2563eb" : "#16a34a";

    return baseTemplate(`
      <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#111827;">New User Registered</h2>
      <p style="margin:0 0 20px;font-size:15px;color:#6b7280;">
        A new user has signed up on TeamoraPH.
      </p>
      <div style="background:#f4f6fb;border-left:3px solid #3D6EFF;border-radius:6px;padding:14px 18px;margin-bottom:24px;">
        <p style="margin:0 0 6px;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">Email</p>
        <p style="margin:0 0 12px;font-size:15px;font-weight:600;color:#111827;">${userEmail}</p>
        <p style="margin:0 0 4px;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">Role</p>
        <span style="font-size:13px;font-weight:700;color:${roleColor};background:${roleColor}1a;padding:3px 10px;border-radius:999px;">${roleLabel}</span>
      </div>
      <a href="${dashboardUrl}"
         style="display:inline-block;background:#3D6EFF;color:#ffffff;font-size:14px;font-weight:600;
                text-decoration:none;padding:12px 28px;border-radius:8px;">
        View Dashboard
      </a>
    `);
}

function applicationConfirmationHtml(jobTitle: string, companyName: string, applicationsUrl: string) {
    return baseTemplate(`
      <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#111827;">Application Submitted!</h2>
      <p style="margin:0 0 20px;font-size:15px;color:#6b7280;">
        Your application for <strong style="color:#111827;">${jobTitle}</strong>
        ${companyName ? `at <strong style="color:#111827;">${companyName}</strong>` : ""}
        has been successfully submitted.
      </p>
      <div style="background:#f4f6fb;border-left:3px solid #3D6EFF;border-radius:6px;padding:14px 18px;margin-bottom:24px;">
        <p style="margin:0;font-size:14px;color:#374151;">
          The employer will review your application and reach out if you're a good fit.
          We'll notify you of any status updates.
        </p>
      </div>
      <a href="${applicationsUrl}"
         style="display:inline-block;background:#3D6EFF;color:#ffffff;font-size:14px;font-weight:600;
                text-decoration:none;padding:12px 28px;border-radius:8px;">
        View My Applications
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

export async function sendWelcomeEmail({
    toEmail,
    name,
    role,
}: {
    toEmail: string;
    name?: string;
    role: "candidate" | "employer";
}) {
    const transporter = getTransporter();
    if (!transporter) return;

    await transporter.sendMail({
        from: FROM,
        to: toEmail,
        subject: `Welcome to TeamoraPH${name ? `, ${name}` : ""}!`,
        html: welcomeHtml(name ?? "", role, APP_URL),
    });
}

export async function sendPaymentStatusEmail({
    toEmail,
    employerName,
    plan,
    status,
    notes,
}: {
    toEmail: string;
    employerName?: string;
    plan: string;
    status: "approved" | "rejected";
    notes?: string;
}) {
    const transporter = getTransporter();
    if (!transporter) return;

    const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);
    const isApproved = status === "approved";
    const statusColor = isApproved ? "#16a34a" : "#dc2626";
    const statusLabel = isApproved ? "Approved ✅" : "Rejected ❌";
    const billingUrl = `${APP_URL}/employer/billing`;

    const html = baseTemplate(`
      <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#111827;">
        Payment ${statusLabel}
      </h2>
      <p style="margin:0 0 20px;font-size:15px;color:#6b7280;">
        ${employerName ? `Hi <strong style="color:#111827;">${employerName}</strong>, your` : "Your"} payment submission for the
        <strong style="color:#111827;">${planLabel}</strong> plan has been reviewed.
      </p>
      <div style="background:#f4f6fb;border-left:3px solid ${statusColor};border-radius:6px;padding:14px 18px;margin-bottom:24px;">
        <p style="margin:0 0 4px;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">Status</p>
        <span style="font-size:16px;font-weight:700;color:${statusColor};">${statusLabel}</span>
        ${notes ? `
        <p style="margin:12px 0 4px;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">${isApproved ? "Note" : "Reason"}</p>
        <p style="margin:0;font-size:14px;color:#374151;">${notes}</p>
        ` : ""}
      </div>
      ${isApproved
        ? `<p style="margin:0 0 20px;font-size:14px;color:#6b7280;">Your subscription is now <strong style="color:#16a34a;">active</strong>. You can start enjoying all ${planLabel} plan features right away.</p>`
        : `<p style="margin:0 0 20px;font-size:14px;color:#6b7280;">Please review the reason above and resubmit your payment proof with the correct details.</p>`
      }
      <a href="${billingUrl}"
         style="display:inline-block;background:#3D6EFF;color:#ffffff;font-size:14px;font-weight:600;
                text-decoration:none;padding:12px 28px;border-radius:8px;">
        ${isApproved ? "Go to Billing" : "Resubmit Payment"}
      </a>
    `);

    await transporter.sendMail({
        from: FROM,
        to: toEmail,
        subject: isApproved
            ? `Your ${planLabel} plan is now active — TeamoraPH`
            : `Payment submission update for ${planLabel} plan — TeamoraPH`,
        html,
    });
}

export async function sendAdminNewJobReviewEmail({
    toEmails,
    jobTitle,
    employerEmail,
    jobId,
}: {
    toEmails: string[];
    jobTitle: string;
    employerEmail: string;
    jobId: string;
}) {
    const transporter = getTransporter();
    if (!transporter || toEmails.length === 0) return;

    const reviewUrl = `${APP_URL}/admin/jobs?highlight=${jobId}`;

    await transporter.sendMail({
        from: FROM,
        to: toEmails.join(", "),
        subject: `[Action Required] New job post pending review: "${jobTitle}" — TeamoraPH`,
        html: adminNewJobReviewHtml(jobTitle, employerEmail, reviewUrl),
    });
}

export async function sendAdminNewUserEmail({
    toEmails,
    userEmail,
    role,
}: {
    toEmails: string[];
    userEmail: string;
    role: string;
}) {
    const transporter = getTransporter();
    if (!transporter || toEmails.length === 0) return;

    const dashboardUrl = `${APP_URL}/admin/dashboard`;

    await transporter.sendMail({
        from: FROM,
        to: toEmails.join(", "),
        subject: `New ${role} registered on TeamoraPH: ${userEmail}`,
        html: adminNewUserHtml(userEmail, role, dashboardUrl),
    });
}

export async function sendApplicationConfirmationEmail({
    toEmail,
    jobTitle,
    companyName,
}: {
    toEmail: string;
    jobTitle: string;
    companyName?: string;
}) {
    const transporter = getTransporter();
    if (!transporter) return;

    const applicationsUrl = `${APP_URL}/candidate/applications`;

    await transporter.sendMail({
        from: FROM,
        to: toEmail,
        subject: `Application submitted for "${jobTitle}" — TeamoraPH`,
        html: applicationConfirmationHtml(jobTitle, companyName ?? "", applicationsUrl),
    });
}
