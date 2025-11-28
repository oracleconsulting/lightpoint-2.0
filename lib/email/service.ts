import { Resend } from 'resend';
import { logger } from '@/lib/logger';

// Initialize Resend client
const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY) 
  : null;

const FROM_EMAIL = 'Lightpoint <hello@lightpoint.uk>';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://lightpoint.uk';

interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send organization invite email
 */
export async function sendOrganizationInviteEmail(params: {
  email: string;
  organizationName: string;
  contactName?: string;
  token: string;
  trialDays: number;
}): Promise<SendEmailResult> {
  if (!resend) {
    logger.warn('⚠️ Resend not configured (RESEND_API_KEY missing), email not sent');
    return { success: false, error: 'Email service not configured' };
  }

  const inviteUrl = `${BASE_URL}/accept-invite?token=${params.token}`;

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.email,
      subject: `You're invited to join Lightpoint - HMRC Complaint Management`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 40px 40px 30px;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                Welcome to Lightpoint
              </h1>
              <p style="margin: 10px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px;">
                AI-Powered HMRC Complaint Management
              </p>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                Hi${params.contactName ? ` ${params.contactName}` : ''},
              </p>
              
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                You've been invited to join <strong>Lightpoint</strong> – the professional platform that helps accountancy practices manage HMRC complaints more effectively with AI-powered analysis and letter generation.
              </p>
              
              <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 30px 0;">
                <p style="margin: 0 0 10px; color: #64748b; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">
                  Your Organization
                </p>
                <p style="margin: 0; color: #1e293b; font-size: 18px; font-weight: 600;">
                  ${params.organizationName}
                </p>
                <p style="margin: 10px 0 0; color: #64748b; font-size: 14px;">
                  Trial Period: <strong>${params.trialDays} days</strong>
                </p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${inviteUrl}" style="display: inline-block; background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 14px rgba(30, 64, 175, 0.4);">
                  Accept Invitation
                </a>
              </div>
              
              <p style="margin: 30px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                This invite expires in 7 days. If you have any questions, simply reply to this email.
              </p>
            </td>
          </tr>
          
          <!-- Features -->
          <tr>
            <td style="padding: 0 40px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 15px; background-color: #f0fdf4; border-radius: 8px; width: 33%;">
                    <p style="margin: 0 0 5px; font-size: 20px;">🤖</p>
                    <p style="margin: 0; color: #166534; font-size: 13px; font-weight: 600;">AI Analysis</p>
                  </td>
                  <td style="width: 10px;"></td>
                  <td style="padding: 15px; background-color: #eff6ff; border-radius: 8px; width: 33%;">
                    <p style="margin: 0 0 5px; font-size: 20px;">📝</p>
                    <p style="margin: 0; color: #1e40af; font-size: 13px; font-weight: 600;">Letter Generation</p>
                  </td>
                  <td style="width: 10px;"></td>
                  <td style="padding: 15px; background-color: #fef3c7; border-radius: 8px; width: 33%;">
                    <p style="margin: 0 0 5px; font-size: 20px;">⏱️</p>
                    <p style="margin: 0; color: #92400e; font-size: 13px; font-weight: 600;">Time Tracking</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 30px 40px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 10px; color: #64748b; font-size: 14px;">
                Lightpoint – Professional HMRC Complaint Management
              </p>
              <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                <a href="https://lightpoint.uk" style="color: #3b82f6; text-decoration: none;">lightpoint.uk</a>
              </p>
            </td>
          </tr>
        </table>
        
        <!-- Unsubscribe -->
        <p style="margin: 20px 0 0; color: #9ca3af; font-size: 12px; text-align: center;">
          If you didn't request this invite, you can safely ignore this email.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
    });

    if (error) {
      logger.error('❌ Failed to send invite email:', error);
      return { success: false, error: error.message };
    }

    logger.info(`✉️ Invite email sent to ${params.email} (ID: ${data?.id})`);
    return { success: true, messageId: data?.id };

  } catch (err: any) {
    logger.error('❌ Error sending invite email:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Send team invite email
 */
export async function sendTeamInviteEmail(params: {
  email: string;
  organizationName: string;
  role: 'admin' | 'user';
  token: string;
  inviterName?: string;
}): Promise<SendEmailResult> {
  if (!resend) {
    logger.warn('⚠️ Resend not configured (RESEND_API_KEY missing), email not sent');
    return { success: false, error: 'Email service not configured' };
  }

  const inviteUrl = `${BASE_URL}/accept-team-invite?token=${params.token}`;
  const roleLabel = params.role === 'admin' ? 'Administrator' : 'Team Member';

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.email,
      subject: `Join ${params.organizationName} on Lightpoint`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 40px 40px 30px;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                Join Your Team
              </h1>
              <p style="margin: 10px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px;">
                ${params.organizationName} on Lightpoint
              </p>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                You've been invited to join <strong>${params.organizationName}</strong> on Lightpoint.
              </p>
              
              <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 30px 0;">
                <p style="margin: 0 0 10px; color: #64748b; font-size: 14px;">
                  Your Role
                </p>
                <p style="margin: 0; color: #1e293b; font-size: 18px; font-weight: 600;">
                  ${roleLabel}
                </p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${inviteUrl}" style="display: inline-block; background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 14px rgba(30, 64, 175, 0.4);">
                  Accept Invitation
                </a>
              </div>
              
              <p style="margin: 30px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                This invite expires in 7 days.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 30px 40px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 10px; color: #64748b; font-size: 14px;">
                Lightpoint – Professional HMRC Complaint Management
              </p>
              <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                <a href="https://lightpoint.uk" style="color: #3b82f6; text-decoration: none;">lightpoint.uk</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
    });

    if (error) {
      logger.error('❌ Failed to send team invite email:', error);
      return { success: false, error: error.message };
    }

    logger.info(`✉️ Team invite email sent to ${params.email} (ID: ${data?.id})`);
    return { success: true, messageId: data?.id };

  } catch (err: any) {
    logger.error('❌ Error sending team invite email:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Check if email service is configured
 */
export function isEmailConfigured(): boolean {
  return !!resend;
}

