import React, { useState, useEffect } from 'react';
import { AlertTriangle, Plus, Trash2, CheckCircle } from 'lucide-react';
import { systemNotificationService, SystemNotification } from '../../services/systemNotificationService';
import { emailService, EmailLog } from '../../services/emailService';

export function NotificationManager() {
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [activeTab, setActiveTab] = useState<'manage' | 'create' | 'history'>('manage');
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'outage' | 'maintenance' | 'info' | 'warning'>('outage');
  const [severity, setSeverity] = useState<'critical' | 'high' | 'medium' | 'low'>('critical');
  const [endsAt, setEndsAt] = useState('');
  const [sending, setSending] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadNotifications();
    loadEmailLogs();
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await systemNotificationService.getActiveNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const loadEmailLogs = async () => {
    try {
      const data = await emailService.getCampaignHistory(20);
      setEmailLogs(data);
    } catch (error) {
      console.error('Error loading email logs:', error);
    }
  };

  const handleCreateNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) {
      alert('Please fill in title and message');
      return;
    }

    setSending(true);
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
      
      setSuccessMessage('✓ Notification created successfully');
      setTitle('');
      setMessage('');
      setEndsAt('');
      loadNotifications();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      alert('Error creating notification: ' + error);
    } finally {
      setSending(false);
    }
  };

  const handleSendEmail = async () => {
    if (!title || !message) {
      alert('Please fill in title and message');
      return;
    }

    setSending(true);
    try {
      const result = await emailService.sendOutageNotification(
        title,
        message,
        endsAt ? new Date(endsAt).toLocaleString() : undefined
      );
      
      setSuccessMessage(`✓ Email sent to ${result.recipientCount} users`);
      loadEmailLogs();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      alert('Error sending email: ' + error);
    } finally {
      setSending(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this notification?')) return;
    
    try {
      await systemNotificationService.deactivateNotification(id);
      loadNotifications();
    } catch (error) {
      alert('Error deactivating notification: ' + error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      case 'high': return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20';
      case 'medium': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
      case 'low': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <AlertTriangle className="w-6 h-6 text-amber-600" />
        <h1 className="text-2xl font-bold">System Notifications & Email</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('manage')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'manage'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          Manage Notifications
        </button>
        <button
          onClick={() => setActiveTab('create')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'create'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          Create Alert
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'history'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          Email History
        </button>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-200 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          {successMessage}
        </div>
      )}

      {/* Tab: Manage Notifications */}
      {activeTab === 'manage' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Active Notifications</h2>
          {notifications.length === 0 ? (
            <div className="text-center p-8 text-gray-500 dark:text-gray-400">
              No active notifications
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map(n => (
                <div key={n.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{n.title}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getSeverityColor(n.severity)}`}>
                          {n.severity}
                        </span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">{n.message}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                        Type: {n.type} | Created: {new Date(n.createdAt).toLocaleString()}
                      </p>
                      {n.endsAt && (
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          Expected resolution: {new Date(n.endsAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeactivate(n.id)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Deactivate"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Create Alert */}
      {activeTab === 'create' && (
        <form onSubmit={handleCreateNotification} className="space-y-4 max-w-2xl">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-blue-900 dark:text-blue-200 text-sm">
            This will create an in-app notification AND send an email to all users.
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Database Outage"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Message *</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Detailed message for users..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              disabled={sending}
              className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
            >
              {sending ? 'Processing...' : 'Create Notification & Send Email'}
            </button>
            <button
              type="button"
              onClick={handleSendEmail}
              disabled={sending}
              className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
              title="Only send email (without creating notification)"
            >
              {sending ? 'Sending...' : 'Send Email Only'}
            </button>
          </div>
        </form>
      )}

      {/* Tab: Email History */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Recent Email Campaigns</h2>
          {emailLogs.length === 0 ? (
            <div className="text-center p-8 text-gray-500 dark:text-gray-400">
              No email campaigns sent yet
            </div>
          ) : (
            <div className="space-y-3">
              {emailLogs.map(log => (
                <div key={log.id} className="bg-white dark:bg-gray-800 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                        {log.campaignName}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{log.subject}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-500">
                        <span>Recipients: {log.recipientCount}</span>
                        <span>Type: {log.contentType}</span>
                        <span>Status: {log.status}</span>
                        <span>{new Date(log.sentAt).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${
                      log.status === 'completed' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-200' :
                      log.status === 'sending' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-200' :
                      log.status === 'pending' ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-200' :
                      'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-200'
                    }`}>
                      {log.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
