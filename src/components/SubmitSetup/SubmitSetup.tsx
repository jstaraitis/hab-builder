import { useState } from 'react';
import { Camera, Mail, FileText } from 'lucide-react';

export function SubmitSetup() {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-2 border-emerald-200 dark:border-emerald-800 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="text-4xl"><Camera className="w-10 h-10" /></div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-emerald-900 dark:text-emerald-200 mb-2">Share Your Setup!</h3>
            <p className="text-emerald-800 dark:text-emerald-300 mb-4">
              Built an amazing enclosure? We'd love to feature it! Share your setup photos and help inspire other keepers in the community.
            </p>
            <button
              onClick={() => setIsOpen(true)}
              className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all transform hover:scale-105"
            >
              Submit Your Setup →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 border-2 border-emerald-200 dark:border-emerald-800 rounded-xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Submit Your Enclosure Setup</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl leading-none"
        >
          ×
        </button>
      </div>

      <div className="space-y-4">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-900 dark:text-blue-200 font-medium mb-2"><Mail className="inline-block w-5 h-5 mr-2"/> Email Your Submission</p>
          <p className="text-sm text-blue-800 dark:text-blue-300 mb-3">
            Send us your setup photos and details at <strong>submissions@habitatbuilder.com</strong>
          </p>
          <p className="text-xs text-blue-700 dark:text-blue-400">
            Include: Species name, enclosure dimensions, setup type (bioactive/standard), and 2-5 high-quality photos
          </p>
        </div>

        <div className="grid gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Species *
            </label>
            <input
              type="text"
              placeholder="e.g., White's Tree Frog"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Width *
              </label>
              <input
                type="number"
                placeholder="18"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Depth *
              </label>
              <input
                type="number"
                placeholder="18"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Height *
              </label>
              <input
                type="number"
                placeholder="24"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Setup Type *
            </label>
            <select className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent">
              <option value="">Select type...</option>
              <option value="minimalist">Minimalist</option>
              <option value="bioactive">Bioactive/Naturalistic</option>
              <option value="display">Display/Show Tank</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              rows={4}
              placeholder="Tell us about your setup... What equipment did you use? Any tips for other keepers?"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Your Name (Optional)
            </label>
            <input
              type="text"
              placeholder="For photo credit"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email *
            </label>
            <input
              type="email"
              placeholder="your@email.com"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              We'll contact you if we feature your setup
            </p>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-sm text-yellow-900 dark:text-yellow-200 font-medium mb-2">
              <FileText className="inline-block w-5 h-5 mr-2"/> Submission Guidelines
            </p>
            <ul className="text-xs text-yellow-800 dark:text-yellow-300 space-y-1">
              <li>• Photos should be high quality (good lighting, clear focus)</li>
              <li>• Must meet proper husbandry standards for the species</li>
              <li>• By submitting, you grant us permission to feature your photos</li>
              <li>• We'll credit you by name (or anonymously if preferred)</li>
            </ul>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <a
            href="mailto:submissions@habitatbuilder.com?subject=Enclosure Setup Submission"
            className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all text-center"
          >
            <Mail className="inline-block w-4 h-4 mr-2"/> Send via Email
          </a>
          <button
            onClick={() => setIsOpen(false)}
            className="px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
