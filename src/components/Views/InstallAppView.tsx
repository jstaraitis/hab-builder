import { Link } from 'react-router-dom';
import { Download, Phone, MoreVertical, PlusSquare, Chrome, Smartphone } from 'lucide-react';

export function InstallAppView() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* iOS App Store banner — most prominent option */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-2xl p-6 sm:p-8 shadow-lg text-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <Phone className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-xs font-semibold uppercase tracking-wide">
              Now Available
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold">Habitat Builder is on the App Store!</h1>
            <p className="text-emerald-100">
              Get the full native iOS experience — faster performance, and push notifications.
            </p>
          </div>
          <a
            href="https://apps.apple.com/app/habitat-builder/id6761064884"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-emerald-700 font-bold rounded-xl shadow hover:bg-emerald-50 transition text-sm sm:text-base"
          >
            Download on the App Store
          </a>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-700 dark:text-emerald-300">
            <Download className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Or Install as a Web App</h2>
            <p className="text-gray-600 dark:text-gray-300">
              On Android or prefer the browser version? Save Habitat Builder to your home screen for quick access, full-screen mode, and faster loading.
            </p>
            <div className="flex flex-wrap gap-2 text-xs sm:text-sm">
              <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-semibold">
                Add to Home Screen
              </span>
              <span className="px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-semibold">
                Optional notifications
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Phone className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">iPhone / iPad</h2>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
            The best way to get Habitat Builder on iPhone or iPad is directly from the App Store.
          </p>
          <a
            href="https://apps.apple.com/app/habitat-builder/id6761064884"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 w-full px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition text-sm"
          >
            Download on the App Store
          </a>
          <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            Or open in Safari and tap Share → Add to Home Screen.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Chrome className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Android (Chrome)</h2>
          </div>
          <ol className="space-y-2 text-sm text-gray-700 dark:text-gray-300 list-decimal list-inside">
            <li>Open Habitat Builder in Chrome.</li>
            <li>Tap the menu (three dots).</li>
            <li>Tap Add to Home screen.</li>
            <li>Confirm the name and tap Add.</li>
          </ol>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span className="inline-flex items-center gap-1"><MoreVertical className="w-3 h-3" /> Menu</span>
            <span className="inline-flex items-center gap-1"><PlusSquare className="w-3 h-3" /> Add to Home screen</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Smartphone className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Samsung Internet</h2>
          </div>
          <ol className="space-y-2 text-sm text-gray-700 dark:text-gray-300 list-decimal list-inside">
            <li>Open Habitat Builder in Samsung Internet.</li>
            <li>Tap the menu (three lines).</li>
            <li>Tap Add page to.</li>
            <li>Select Home screen and confirm.</li>
          </ol>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Smartphone className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Edge (Android)</h2>
          </div>
          <ol className="space-y-2 text-sm text-gray-700 dark:text-gray-300 list-decimal list-inside">
            <li>Open Habitat Builder in Edge.</li>
            <li>Tap the menu (three dots).</li>
            <li>Tap Add to phone or Add to Home screen.</li>
            <li>Confirm to install.</li>
          </ol>
        </div>
      </div>

      <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-emerald-900 dark:text-emerald-200">Need notification reminders?</h3>
        <p className="text-sm text-emerald-800 dark:text-emerald-300 mt-2">
          After installing, open the Care Calendar and enable reminders. You can allow notifications when prompted to get feeding, misting, and cleaning alerts.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          to="/"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-800 dark:text-gray-200 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition"
        >
          Back to Home
        </Link>
        <Link
          to="/care-calendar"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-sm transition"
        >
          Open Care Calendar
        </Link>
      </div>
    </div>
  );
}
