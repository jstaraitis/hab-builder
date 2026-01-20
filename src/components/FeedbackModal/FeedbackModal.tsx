interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const GOOGLE_FORM_ID = import.meta.env.VITE_GOOGLE_FORM_ID;
  
  // Construct the embed URL from the form ID
  const EMBED_URL = GOOGLE_FORM_ID 
    ? `https://docs.google.com/forms/d/e/${GOOGLE_FORM_ID}/viewform?embedded=true`
    : null;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">📝 Send Feedback</h2>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-2xl leading-none"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {EMBED_URL ? (
            <iframe
              src={EMBED_URL}
              width="100%"
              height="100%"
              frameBorder="0"
              marginHeight={0}
              marginWidth={0}
              title="Habitat Builder Feedback Form"
              className="w-full h-full dark:brightness-90"
              style={{ minHeight: '600px' }}
              allow="camera; microphone"
            >
              Loading…
            </iframe>
          ) : (
            <div className="p-6 text-center">
              <p className="text-red-600 dark:text-red-400 font-semibold">Feedback form not configured</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Please add VITE_GOOGLE_FORM_ID to your .env file
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
