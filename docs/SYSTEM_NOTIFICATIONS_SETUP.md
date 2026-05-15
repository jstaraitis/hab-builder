# System Notifications & Email Campaign Setup Guide

This guide covers setting up the outage notification system and mass email capabilities for Habitat Builder.

## Overview

The system includes three key components:
1. **System Notifications** - Database-driven banners displayed on login and throughout the app
2. **Email Campaigns** - Mass email capability for notifying users about outages/maintenance
3. **Email Opt-Out** - Users can opt out of marketing emails while always receiving critical outage alerts

---

## Step 1: Database Setup

### Run the Migration

1. Go to your Supabase dashboard → **SQL Editor**
2. Click **New query**
3. Copy and paste the contents of `docs/SYSTEM_NOTIFICATIONS_MIGRATION.sql`
4. Click **Run**

This creates three tables:
- `system_notifications` - Stores outage/maintenance/info alerts
- `email_opt_out` - Tracks user email preferences
- `email_logs` - Tracks email campaign history

---

## Step 2: Deploy Edge Function (for Email Sending)

The `send-campaign-email` edge function handles actual email delivery. Follow these steps:

### Prerequisites

You'll need to choose an email provider. Recommended options:
- **Resend** (recommended) - https://resend.com - Easy integration, affordable
- **SendGrid** - https://sendgrid.com
- **AWS SES** - https://aws.amazon.com/ses/

### Setup with Resend (Recommended)

1. Sign up for a free Resend account at https://resend.com
2. Get your API key from the Resend dashboard
3. Deploy the edge function:
   ```bash
   supabase functions deploy send-campaign-email
   ```
4. Set environment variables in your Supabase project:
   ```
   RESEND_API_KEY=your_resend_api_key_here
   RESEND_FROM_EMAIL=noreply@habitat-builder.app  # Update to your domain
   ```

### Setting Environment Variables

1. Go to Supabase Dashboard → **Project Settings** → **Edge Functions**
2. Add secrets:
   - `RESEND_API_KEY` - Your Resend API key
   - `RESEND_FROM_EMAIL` - Sender email address

---

## Step 3: Admin Control Panel (Optional but Recommended)

Create an admin-only page to manage notifications and send emails. Here's a example component:

```typescript
// src/components/Admin/NotificationManager.tsx
import { useState } from 'react';
import { systemNotificationService, SystemNotification } from '../../services/systemNotificationService';
import { emailService } from '../../services/emailService';

export function NotificationManager() {
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'outage' | 'maintenance' | 'info' | 'warning'>('outage');
  const [severity, setSeverity] = useState<'critical' | 'high' | 'medium' | 'low'>('high');
  const [endsAt, setEndsAt] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateNotification = async () => {
    setLoading(true);
    try {
      await systemNotificationService.createNotification({
        title,
        message,
        type,
        severity,
        isActive: true,
        showOnLogin: true,
        startsAt: new Date().toISOString(),
        endsAt: endsAt ? new Date(endsAt).toISOString() : null,
      });
      // Clear form
      setTitle('');
      setMessage('');
      setEndsAt('');
      alert('✓ Notification created successfully');
    } catch (error) {
      alert('Error creating notification: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendOutageEmail = async () => {
    if (!title || !message) {
      alert('Please fill in title and message');
      return;
    }
    
    setLoading(true);
    try {
      const result = await emailService.sendOutageNotification(title, message, endsAt);
      alert(`✓ Email sent to ${result.recipientCount} users`);
    } catch (error) {
      alert('Error sending email: ' + error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-bold">Create Notification & Send Email</h2>
        
        <div>
          <label className="block text-sm font-medium mb-2">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Database Maintenance"
            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Detailed message for users..."
            rows={4}
            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="outage">Outage</option>
              <option value="maintenance">Maintenance</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Severity</label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as any)}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Expected Resolution (Optional)</label>
          <input
            type="datetime-local"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
          />
        </div>

        <div className="flex gap-2 pt-4">
          <button
            onClick={handleCreateNotification}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg"
          >
            {loading ? 'Creating...' : 'Create In-App Notification'}
          </button>
          <button
            onClick={handleSendOutageEmail}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg"
          >
            {loading ? 'Sending...' : 'Send Email Alert'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## Step 4: Quick Start - Sending Your First Notification

### Via the Browser Console (Quick Test)

1. Open your app in browser and log in as admin
2. Open Developer Console (F12)
3. Run this code:

```javascript
// Import the services (assumes they're accessible)
// Note: You may need to use the actual import path

// Create a notification
systemNotificationService.createNotification({
  title: "Database Maintenance",
  message: "We're performing maintenance on our database. Service may be intermittent.",
  type: "maintenance",
  severity: "high",
  isActive: true,
  showOnLogin: true,
  startsAt: new Date().toISOString(),
  endsAt: new Date(Date.now() + 3600000).toISOString() // 1 hour from now
});

// Send outage email
emailService.sendOutageNotification(
  "Database Outage",
  "Our database is currently experiencing issues. We're working to restore service as quickly as possible.",
  "Expected resolution by 2:00 PM EST"
);
```

### Via Supabase Dashboard (Direct Database Entry)

1. Go to Supabase Dashboard → **SQL Editor**
2. Run this query to create a notification:

```sql
INSERT INTO system_notifications (title, message, type, severity, is_active, show_on_login, starts_at, ends_at, created_by)
VALUES (
  'Database Maintenance',
  'We are performing scheduled maintenance. Service may be intermittent.',
  'maintenance',
  'high',
  true,
  true,
  NOW(),
  NOW() + INTERVAL '2 hours',
  auth.uid()  -- Replace with an actual admin user ID if needed
);
```

---

## Step 5: Production Considerations

### Security & Admin Access

1. **Restrict notification creation** - Only admins should create notifications
2. **Audit logging** - Track who created/modified notifications
3. **Approval workflow** - Consider requiring approval before sending mass emails

### Email Provider Setup for Production

- **Domain Setup** - Configure SPF/DKIM/DMARC records with your email provider for better deliverability
- **Sender Address** - Use a branded address (e.g., `noreply@your-domain.com`)
- **Templates** - Create professional email templates
- **Rate Limiting** - Implement rate limiting to avoid abuse

### Cost Management

- **Resend** - $0.35 per 1,000 emails, first 100 emails free monthly
- **SendGrid** - 100 emails/day free tier
- **AWS SES** - Pay per email sent (~$0.10 per 1,000)

---

## Usage Examples

### Scenario 1: Current Outage (Like Your Supabase Incident)

```typescript
// Immediate outage notification
const result = await systemNotificationService.createNotification({
  title: "Supabase Datacenter Outage",
  message: "We are experiencing database connectivity issues due to a Supabase datacenter outage. Our team is monitoring the situation.",
  type: "outage",
  severity: "critical",
  isActive: true,
  showOnLogin: true,
  startsAt: new Date().toISOString(),
  endsAt: null, // Will be resolved manually or set later
});

// Send email alert
await emailService.sendOutageNotification(
  "Supabase Datacenter Outage - Habitat Builder Service Affected",
  "Our database is currently unavailable due to a Supabase datacenter incident. We're monitoring the situation closely and will provide updates as available.",
  "Estimated resolution: TBD - will update hourly"
);
```

### Scenario 2: Scheduled Maintenance

```typescript
const tomorrow2am = new Date();
tomorrow2am.setDate(tomorrow2am.getDate() + 1);
tomorrow2am.setHours(2, 0, 0, 0);

await systemNotificationService.createNotification({
  title: "Scheduled Maintenance",
  message: "We'll be performing database maintenance. Service will be unavailable for approximately 1 hour.",
  type: "maintenance",
  severity: "medium",
  isActive: true,
  showOnLogin: true,
  startsAt: tomorrow2am.toISOString(),
  endsAt: new Date(tomorrow2am.getTime() + 3600000).toISOString(),
});

await emailService.sendMaintenanceNotification(
  "Scheduled Maintenance on September 15th",
  "We'll be performing scheduled maintenance on our database.",
  new Date(tomorrow2am.getTime() + 3600000).toLocaleString()
);
```

---

## Troubleshooting

### Notifications Not Showing on Login

- Check if `is_active = true` in database
- Check if `show_on_login = true` in database
- Check if `starts_at <= NOW()` and `(ends_at IS NULL OR ends_at > NOW())`

### Emails Not Being Sent

- Verify Edge Function is deployed: `supabase functions list`
- Check if API keys are set: `supabase secrets list`
- Verify email provider (Resend, SendGrid) has quota available
- Check email logs in dashboard for failed campaigns

### Users Seeing Old Notifications

- Clear browser cache
- Set `is_active = false` to hide notification
- Or set `ends_at = NOW()` to expire it

---

## Next Steps

1. ✅ Run the database migration (Step 1)
2. ✅ Deploy the edge function (Step 2)
3. ✅ Choose your email provider and add API key
4. ✅ Test with console commands (Step 4)
5. ⭕ (Optional) Create admin control panel (Step 3)
6. ⭕ Set up production email domain
7. ⭕ Create team procedures for handling outages

For immediate outage notifications during Supabase issues, you now have:
- **In-app banner** visible to all users on login + throughout app
- **Email alerts** sent to all users (regardless of preference for outages)
- **Detailed tracking** of when notifications were created/modified
- **Opt-out management** for marketing emails (while preserving critical alerts)
