/**
 * SendGrid helper functions for sending dynamic template emails.
 * 
 * This module provides convenience wrappers around the SendGrid HTTP API
 * for sending account verification and password reset emails.
 */

interface SendGridResponse {
  success: boolean;
  status: number;
  messageId?: string;
}

/**
 * Generic function to send an email using a SendGrid dynamic template.
 */
async function sendgridSendTemplateEmail(
  to: string,
  templateId: string,
  dynamicData: Record<string, any>,
  maxRetries: number = 3,
  emailType: 'verify' | 'reset' = 'verify'
): Promise<SendGridResponse> {
  const url = 'https://api.sendgrid.com/v3/mail/send';
  
  // Use same defaults as config.ts
  const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'no-reply@pozi.com';
  const fromName = process.env.SENDGRID_FROM_NAME || 'Pozi Student Living';
  const apiKey = process.env.SENDGRID_API_KEY;

  if (!apiKey) {
    throw new Error('SendGrid config missing: SENDGRID_API_KEY is required.');
  }

  const payload = {
    personalizations: [{
      to: [{ email: to }],
      dynamic_template_data: dynamicData,
    }],
    from: {
      email: fromEmail,
      name: fromName || fromEmail,
    },
    reply_to: {
      email: fromEmail,
      name: fromName || fromEmail,
    },
    template_id: templateId,
    tracking_settings: {
      click_tracking: { enable: false, enable_text: false },
      open_tracking: { enable: true },
    },
    categories: ['auth', emailType === 'reset' ? 'password-reset' : 'verification'],
    // Note: custom_args in SendGrid must be string key-value pairs
    // PHP uses array which becomes object in JSON, TypeScript object is correct
    custom_args: { app: 'auth-api', type: emailType },
  };

  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };

  let attempt = 0;
  let lastError: Error | null = null;

  while (attempt < maxRetries) {
    attempt++;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const messageId = response.headers.get('x-message-id') || undefined;

      if (response.status >= 200 && response.status < 300) {
        return {
          success: true,
          status: response.status,
          messageId,
        };
      }

      const errorData = await response.json().catch(() => ({}));
      const messages: string[] = [];
      
      if (errorData.errors && Array.isArray(errorData.errors)) {
        errorData.errors.forEach((e: any) => {
          let msg = e.message || 'Unknown error';
          if (e.field) msg += ` [field: ${e.field}]`;
          if (e.help) msg += ` [help: ${e.help}]`;
          messages.push(msg);
        });
      }

      const errText = `SendGrid API Error (${response.status}): ${messages.length ? messages.join('; ') : JSON.stringify(errorData)}`;

      // Retry on rate limiting or server errors
      if (response.status === 429 || (response.status >= 500 && response.status <= 599)) {
        const backoffs = [250, 1000, 3000];
        const delayMs = backoffs[Math.min(attempt - 1, backoffs.length - 1)];
        await new Promise(resolve => setTimeout(resolve, delayMs));
        lastError = new Error(errText);
        continue;
      }

      throw new Error(errText);
    } catch (error: any) {
      lastError = error;
      if (attempt < maxRetries) {
        const backoffs = [250, 1000, 3000];
        const delayMs = backoffs[Math.min(attempt - 1, backoffs.length - 1)];
        await new Promise(resolve => setTimeout(resolve, delayMs));
        continue;
      }
    }
  }

  throw lastError || new Error('SendGrid: Unknown error after retries');
}

/**
 * Send an account verification email.
 */
export async function sendgridSendVerificationEmail(
  to: string,
  firstName: string | null,
  verifyLink: string
): Promise<SendGridResponse> {
  // Use template ID from environment or config
  const templateId = process.env.SENDGRID_TEMPLATE_ID || '';
  
  if (!templateId) {
    throw new Error('SENDGRID_TEMPLATE_ID is required.');
  }

  const dynamicData = {
    first_name: firstName || 'there',
    link: verifyLink,
  };

  return sendgridSendTemplateEmail(to, templateId, dynamicData, 3, 'verify');
}

/**
 * Send a password reset email.
 */
export async function sendgridSendPasswordResetEmail(
  to: string,
  firstName: string | null,
  resetLink: string
): Promise<SendGridResponse> {
  // Use template ID from environment or config
  const templateId = process.env.SENDGRID_PASSWORD_RESET_TEMPLATE_ID || '';
  
  if (!templateId) {
    throw new Error('SENDGRID_PASSWORD_RESET_TEMPLATE_ID is required.');
  }

  const dynamicData = {
    first_name: firstName || 'there',
    link: resetLink,
  };

  return sendgridSendTemplateEmail(to, templateId, dynamicData, 3, 'reset');
}

