import { Link } from 'react-router-dom';
import { SEO } from '../SEO/SEO';

export function PrivacyPolicy() {
  return (
    <>
      <SEO
        title="Privacy Policy - Habitat Builder"
        description="Privacy Policy for Habitat Builder. Learn how we collect, use, and protect your personal information."
        keywords={['privacy policy', 'habitat builder', 'data protection']}
      />

      <div className="max-w-4xl mx-auto space-y-8 pb-12">
        {/* Hero */}
        <div className="bg-gradient-to-r from-accent to-teal-600 rounded-xl p-6 text-white">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-base text-accent">Last updated: March 2026</p>
        </div>

        {/* Introduction */}
        <div className="bg-card rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-3">Introduction</h2>
          <p className="text-secondary leading-relaxed">
            Habitat Builder ("we", "us", or "our") is committed to protecting your privacy. This
            Privacy Policy explains what information we collect, how we use it, and your rights
            regarding your data when you use our web application at{' '}
            <strong>habitatbuilder.app</strong>.
          </p>
        </div>

        {/* Information We Collect */}
        <div className="bg-card rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Information We Collect</h2>

          <h3 className="text-base font-semibold text-white mb-2">Account Information</h3>
          <p className="text-secondary leading-relaxed mb-4">
            When you create an account, we collect your email address and any profile information
            you choose to provide (such as a display name). Authentication is handled securely via
            Supabase.
          </p>

          <h3 className="text-base font-semibold text-white mb-2">App Data You Create</h3>
          <p className="text-secondary leading-relaxed mb-4">
            For premium features, we store data you voluntarily enter — including animal records,
            enclosure configurations, care calendar tasks, weight logs, and inventory items. This
            data is associated with your account and stored securely in our database.
          </p>

          <h3 className="text-base font-semibold text-white mb-2">Usage & Technical Data</h3>
          <p className="text-secondary leading-relaxed">
            We may collect basic usage analytics (such as pages visited and features used) to
            improve the application. We do not sell this data. Technical data such as browser type,
            device type, and IP address may be collected by hosting and analytics providers.
          </p>
        </div>

        {/* How We Use Your Information */}
        <div className="bg-card rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-3">How We Use Your Information</h2>
          <ul className="space-y-2 text-secondary leading-relaxed list-disc list-inside">
            <li>To provide and maintain the Habitat Builder service</li>
            <li>To save your animals, enclosures, and care data across devices</li>
            <li>To send care reminders and push notifications (only if you opt in)</li>
            <li>To process premium subscription payments (via a third-party payment provider)</li>
            <li>To improve app features based on aggregate usage patterns</li>
            <li>To respond to support requests or feedback</li>
          </ul>
        </div>

        {/* Data Storage & Security */}
        <div className="bg-card rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-3">Data Storage &amp; Security</h2>
          <p className="text-secondary leading-relaxed mb-4">
            Your data is stored using <strong>Supabase</strong>, which provides encrypted storage
            and secure authentication. Row-level security policies ensure that only you can access
            your own data.
          </p>
          <p className="text-secondary leading-relaxed">
            While we take reasonable precautions to protect your information, no method of
            transmission over the internet is 100% secure. We encourage you to use a strong, unique
            password for your account.
          </p>
        </div>

        {/* Third-Party Services */}
        <div className="bg-card rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-3">Third-Party Services</h2>
          <p className="text-secondary leading-relaxed mb-3">
            We use the following third-party services that may process your data:
          </p>
          <ul className="space-y-2 text-secondary leading-relaxed list-disc list-inside">
            <li>
              <strong>Supabase</strong> — database, authentication, and storage
            </li>
            <li>
              <strong>Netlify</strong> — hosting and CDN
            </li>
            <li>
              <strong>Stripe</strong> (if applicable) — payment processing for premium subscriptions
            </li>
          </ul>
          <p className="text-secondary leading-relaxed mt-3">
            Each of these providers has their own privacy policy. We only share the minimum data
            necessary for these services to function.
          </p>
        </div>

        {/* Push Notifications */}
        <div className="bg-card rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-3">Push Notifications</h2>
          <p className="text-secondary leading-relaxed">
            If you opt in to push notifications, your browser's push subscription token is stored to
            deliver care reminders. You can revoke notification permission at any time through your
            browser or device settings, or from your{' '}
            <Link to="/profile" className="text-accent underline hover:no-underline">
              Profile
            </Link>{' '}
            page.
          </p>
        </div>

        {/* Your Rights */}
        <div className="bg-card rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-3">Your Rights</h2>
          <p className="text-secondary leading-relaxed mb-3">You have the right to:</p>
          <ul className="space-y-2 text-secondary leading-relaxed list-disc list-inside">
            <li>Access the personal data we hold about you</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your account and associated data</li>
            <li>Withdraw consent for optional data processing (e.g., notifications) at any time</li>
          </ul>
          <p className="text-secondary leading-relaxed mt-4">
            To exercise any of these rights, please contact us using the feedback option on the{' '}
            <Link to="/about" className="text-accent underline hover:no-underline">
              About page
            </Link>
            .
          </p>
        </div>

        {/* Children's Privacy */}
        <div className="bg-card rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-3">Children's Privacy</h2>
          <p className="text-secondary leading-relaxed">
            Habitat Builder is not directed at children under the age of 13. We do not knowingly
            collect personal information from children under 13. If you believe a child has provided
            us with personal data, please contact us so we can remove it.
          </p>
        </div>

        {/* Changes to This Policy */}
        <div className="bg-card rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-3">Changes to This Policy</h2>
          <p className="text-secondary leading-relaxed">
            We may update this Privacy Policy from time to time. When we do, we will update the
            "Last updated" date at the top of this page. Continued use of Habitat Builder after
            changes are posted constitutes your acceptance of the updated policy.
          </p>
        </div>

        {/* Footer */}
        <div className="text-center text-muted text-sm pb-4">
          <p>
            Questions? Use the feedback form on the{' '}
            <Link to="/about" className="text-accent underline hover:no-underline">
              About page
            </Link>
            .
          </p>
        </div>
      </div>
    </>
  );
}
