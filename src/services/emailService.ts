import { supabase } from '../lib/supabase';

export interface EmailCampaignRequest {
  campaignName: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  contentType: 'outage' | 'maintenance' | 'notification' | 'marketing';
  excludeOptedOut?: boolean;
  targetUserIds?: string[]; // If specified, only send to these users
}

export interface EmailLog {
  id: string;
  campaignName: string;
  recipientCount: number;
  subject: string;
  contentType: string;
  sentAt: string;
  status: 'pending' | 'sending' | 'completed' | 'failed';
}

class EmailService {
  /**
   * Send mass email campaign to all users (respecting opt-out preferences)
   * NOTE: This requires an edge function to be set up in your Supabase project
   */
  async sendCampaignEmail(request: EmailCampaignRequest): Promise<{ logId: string; recipientCount: number }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Must be authenticated as admin');

    // Start by creating a log entry
    const { data: logData, error: logError } = await supabase
      .from('email_logs')
      .insert({
        campaign_name: request.campaignName,
        recipient_count: 0,
        subject: request.subject,
        content_type: request.contentType,
        created_by: user.id,
        status: 'pending',
      })
      .select()
      .single();

    if (logError) {
      console.error('Error creating email log:', logError);
      throw logError;
    }

    try {
      // Call the edge function to send emails
      const { data, error } = await supabase.functions.invoke('send-campaign-email', {
        body: {
          logId: logData.id,
          campaignName: request.campaignName,
          subject: request.subject,
          htmlContent: request.htmlContent,
          textContent: request.textContent,
          contentType: request.contentType,
          excludeOptedOut: request.excludeOptedOut !== false, // Default to true
          targetUserIds: request.targetUserIds,
        },
      });

      if (error) {
        console.error('Error invoking email function:', error);
        // Update log status to failed
        await supabase
          .from('email_logs')
          .update({ status: 'failed' })
          .eq('id', logData.id);
        throw error;
      }

      return {
        logId: logData.id,
        recipientCount: data?.recipientCount || 0,
      };
    } catch (error) {
      // Update log status to failed
      try {
        await supabase
          .from('email_logs')
          .update({ status: 'failed' })
          .eq('id', logData.id);
      } catch (rollbackError) {
        // Ignore errors on rollback
        console.error('Failed to update log status:', rollbackError);
      }

      throw error;
    }
  }

  /**
   * Send outage notification email to all users
   */
  async sendOutageNotification(title: string, message: string, expectedResolution?: string): Promise<{ logId: string; recipientCount: number }> {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">⚠️ ${title}</h1>
        </div>
        <div style="background-color: #f5f5f5; padding: 30px; border-radius: 0 0 8px 8px;">
          <p style="margin-top: 0; font-size: 16px; color: #333;">
            ${message}
          </p>
          ${expectedResolution ? `
            <div style="background-color: #fff; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; font-size: 14px; color: #666;">
                <strong>Expected resolution:</strong> ${expectedResolution}
              </p>
            </div>
          ` : ''}
          <p style="margin-top: 20px; font-size: 14px; color: #666;">
            Thank you for your patience while we resolve this issue.
          </p>
          <p style="margin-bottom: 0; font-size: 12px; color: #999;">
            Habitat Builder Team
          </p>
        </div>
      </div>
    `;

    return this.sendCampaignEmail({
      campaignName: `Outage Alert: ${title}`,
      subject: `⚠️ ${title}`,
      htmlContent,
      textContent: `${title}\n\n${message}${expectedResolution ? `\n\nExpected resolution: ${expectedResolution}` : ''}`,
      contentType: 'outage',
      excludeOptedOut: false, // Always send outage alerts regardless of opt-out for 'marketing'
    });
  }

  /**
   * Send maintenance notification email to all users
   */
  async sendMaintenanceNotification(title: string, message: string, scheduledTime?: string): Promise<{ logId: string; recipientCount: number }> {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f59e0b; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">🔧 ${title}</h1>
        </div>
        <div style="background-color: #f5f5f5; padding: 30px; border-radius: 0 0 8px 8px;">
          <p style="margin-top: 0; font-size: 16px; color: #333;">
            ${message}
          </p>
          ${scheduledTime ? `
            <div style="background-color: #fff; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; font-size: 14px; color: #666;">
                <strong>Scheduled maintenance:</strong> ${scheduledTime}
              </p>
            </div>
          ` : ''}
          <p style="margin-top: 20px; font-size: 14px; color: #666;">
            We apologize for any inconvenience this may cause.
          </p>
          <p style="margin-bottom: 0; font-size: 12px; color: #999;">
            Habitat Builder Team
          </p>
        </div>
      </div>
    `;

    return this.sendCampaignEmail({
      campaignName: `Maintenance Alert: ${title}`,
      subject: `🔧 ${title}`,
      htmlContent,
      textContent: `${title}\n\n${message}${scheduledTime ? `\n\nScheduled maintenance: ${scheduledTime}` : ''}`,
      contentType: 'maintenance',
    });
  }

  /**
   * Get email campaign history
   */
  async getCampaignHistory(limit: number = 50): Promise<EmailLog[]> {
    const { data, error } = await supabase
      .from('email_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching email logs:', error);
      return [];
    }

    return (data || []).map(log => ({
      id: log.id,
      campaignName: log.campaign_name,
      recipientCount: log.recipient_count,
      subject: log.subject,
      contentType: log.content_type,
      sentAt: log.sent_at,
      status: log.status,
    }));
  }

  /**
   * Get campaign details
   */
  async getCampaignDetails(logId: string): Promise<EmailLog | null> {
    const { data, error } = await supabase
      .from('email_logs')
      .select('*')
      .eq('id', logId)
      .single();

    if (error) {
      console.error('Error fetching campaign:', error);
      return null;
    }

    return data ? {
      id: data.id,
      campaignName: data.campaign_name,
      recipientCount: data.recipient_count,
      subject: data.subject,
      contentType: data.content_type,
      sentAt: data.sent_at,
      status: data.status,
    } : null;
  }

  /**
   * Get count of all users in the system
   */
  async getTotalUserCount(): Promise<number> {
    const { data, error } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true });

    if (error) {
      console.error('Error fetching user count:', error);
      return 0;
    }

    return data ? data.length : 0;
  }

  /**
   * Get count of users who have opted out of email type
   */
  async getOptedOutCount(emailType: 'marketing' | 'outage' | 'all'): Promise<number> {
    const { data, error } = await supabase
      .from('email_opt_out')
      .select('id', { count: 'exact', head: true })
      .in('email_type', [emailType, 'all']);

    if (error) {
      console.error('Error fetching opted out count:', error);
      return 0;
    }

    return data ? data.length : 0;
  }
}

export const emailService = new EmailService();
