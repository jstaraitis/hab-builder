import { useState } from 'react';
import { X } from 'lucide-react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const inputClass = 'w-full px-3 py-2.5 bg-card-elevated border border-divider rounded-xl text-white text-sm focus:border-accent focus:outline-none placeholder:text-muted';

  const handleSubmit = () => {
    if (!email.trim() || !message.trim()) {
      alert('Please fill in both email and feedback message');
      return;
    }

    const subject = 'Habitat Builder Feedback';
    const body = `From: ${email}\n\n${message}`;
    const mailtoLink = `mailto:josh.habitat.builder@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    window.location.href = mailtoLink;
    
    // Show success message
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setEmail('');
      setMessage('');
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 pb-16 sm:pb-0 p-4">
      <div className="bg-card rounded-t-2xl sm:rounded-2xl shadow-xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-divider shrink-0">
          <h2 className="text-lg font-bold text-white">Send Feedback</h2>
          <button
            onClick={onClose}
            className="text-muted p-1 rounded-lg"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 flex flex-col gap-3 overflow-y-auto">
          {submitted ? (
            <div className="text-center py-8 bg-card-elevated border border-divider rounded-xl">
              <p className="text-accent font-semibold text-lg">Thank you for your feedback!</p>
              <p className="text-sm text-muted mt-2">Your email client is opening...</p>
            </div>
          ) : (
            <>
              <div className="bg-card-elevated border border-divider rounded-xl p-3">
                <label htmlFor="email" className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
                  Your Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className={inputClass}
                />
              </div>

              <div className="bg-card-elevated border border-divider rounded-xl p-3">
                <label htmlFor="message" className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
                  Your Feedback
                </label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us what you think..."
                  rows={6}
                  className={`${inputClass} resize-none`}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-full bg-card border border-divider text-white text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-4 py-2 rounded-full bg-accent text-on-accent text-sm font-semibold"
                >
                  Send Feedback
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
