import { logger } from "./logger";

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface Mailer {
  readonly providerName: string;
  readonly isConfigured: boolean;
  send(params: SendEmailParams): Promise<void>;
}

class LogMailer implements Mailer {
  readonly providerName = "log";
  readonly isConfigured = false;

  async send(params: SendEmailParams): Promise<void> {
    logger.warn(
      { to: params.to, subject: params.subject },
      "Email provider is not configured — message was only logged",
    );
    logger.info(
      { to: params.to, subject: params.subject, text: params.text ?? params.html },
      "Outbound email (log-only)",
    );
  }
}

class BrevoMailer implements Mailer {
  readonly providerName = "brevo";
  readonly isConfigured = true;
  private apiKey: string;
  private fromEmail: string;
  private fromName: string;

  constructor(apiKey: string, from: string) {
    this.apiKey = apiKey;
    // Support "Name <email>" or plain "email" format
    const match = from.match(/^(.+)<(.+)>$/);
    if (match) {
      this.fromName = match[1]!.trim();
      this.fromEmail = match[2]!.trim();
    } else {
      this.fromName = "Зеркало Судьбы";
      this.fromEmail = from.trim();
    }
  }

  async send(params: SendEmailParams): Promise<void> {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": this.apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender: { name: this.fromName, email: this.fromEmail },
        to: [{ email: params.to }],
        subject: params.subject,
        htmlContent: params.html,
        textContent: params.text,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Brevo API error ${res.status}: ${body}`);
    }
  }
}

class ResendMailer implements Mailer {
  readonly providerName = "resend";
  readonly isConfigured = true;
  private apiKey: string;
  private from: string;

  constructor(apiKey: string, from: string) {
    this.apiKey = apiKey;
    this.from = from;
  }

  async send(params: SendEmailParams): Promise<void> {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: this.from,
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Resend API error ${res.status}: ${body}`);
    }
  }
}

function selectMailer(): Mailer {
  const brevoKey = process.env["BREVO_API_KEY"];
  const mailFrom = process.env["MAIL_FROM"];
  if (brevoKey && mailFrom) {
    return new BrevoMailer(brevoKey, mailFrom);
  }
  const resendKey = process.env["RESEND_API_KEY"];
  if (resendKey && mailFrom) {
    return new ResendMailer(resendKey, mailFrom);
  }
  return new LogMailer();
}

export const mailer: Mailer = selectMailer();

export class MailerNotConfiguredError extends Error {
  readonly code = "MAILER_NOT_CONFIGURED";
  constructor() {
    super("Email-провайдер не настроен. Свяжитесь с поддержкой.");
  }
}
