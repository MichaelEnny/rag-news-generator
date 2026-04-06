import { Resend } from "resend";

import { env } from "@/lib/env";
import type { CurationPreviewItem, EmailPreview, ProfileRecord } from "@/lib/types";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

export function buildEmailPreview(profile: ProfileRecord, items: CurationPreviewItem[]): EmailPreview {
  const dateLabel = new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(new Date());
  const greeting = `Hey ${profile.name}, your AI desk is ready for ${dateLabel}.`;
  const introduction = items.length
    ? `The top stories today lean into ${items
        .slice(0, 3)
        .map((item) => item.sourceSlug.replace(/-/g, " "))
        .join(", ")}. The list below is ranked against your profile for practical, technically dense signal.`
    : "No ranked digests are available yet, so the system is holding a preview-only issue.";

  const markdown = [
    greeting,
    "",
    introduction,
    "",
    ...items.slice(0, profile.topN).flatMap((item) => [
      `## ${item.rank}. ${item.title}`,
      item.summary,
      `Source: ${item.sourceSlug}`,
      `[Read more](${item.url})`,
      ""
    ])
  ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;padding:24px;color:#17222e;">
      <h2 style="font-size:24px;margin-bottom:12px;">${greeting}</h2>
      <p style="font-size:16px;line-height:1.6;">${introduction}</p>
      ${items
        .slice(0, profile.topN)
        .map(
          (item) => `
            <section style="padding:18px 0;border-top:1px solid #dce3ea;">
              <p style="font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#8e3314;">#${item.rank} • ${item.sourceSlug}</p>
              <h3 style="margin:6px 0 8px;">${item.title}</h3>
              <p style="line-height:1.6;">${item.summary}</p>
              <a href="${item.url}" style="color:#8e3314;font-weight:700;text-decoration:none;">Open source</a>
            </section>
          `
        )
        .join("")}
    </div>
  `.trim();

  return {
    subject: `Daily AI News Desk | ${dateLabel}`,
    greeting,
    introduction,
    html,
    markdown,
    generatedAt: new Date().toISOString()
  };
}

export async function sendDigestEmail(preview: EmailPreview) {
  return sendDigestEmailToRecipient(preview, env.EMAIL_TO ?? null);
}

export async function sendDigestEmailToRecipient(preview: EmailPreview, recipientEmail: string | null) {
  if (!resend || !env.EMAIL_FROM || !recipientEmail) {
    return {
      sent: false,
      previewOnly: true,
      providerMessageId: null,
      error: !recipientEmail
        ? "No recipient email was available for this run."
        : !env.EMAIL_FROM
          ? "EMAIL_FROM is not configured."
          : "RESEND_API_KEY is not configured."
    };
  }

  try {
    const result = await resend.emails.send({
      from: env.EMAIL_FROM,
      to: recipientEmail,
      subject: preview.subject,
      html: preview.html,
      text: preview.markdown
    });

    if (result.error) {
      return {
        sent: false,
        previewOnly: false,
        providerMessageId: null,
        error: result.error.message ?? "Resend rejected the email."
      };
    }

    return {
      sent: true,
      previewOnly: false,
      providerMessageId: result.data?.id ?? null,
      error: null
    };
  } catch (error) {
    return {
      sent: false,
      previewOnly: false,
      providerMessageId: null,
      error: error instanceof Error ? error.message : "Unknown email send failure."
    };
  }
}
