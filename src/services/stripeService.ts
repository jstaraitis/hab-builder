import { loadStripe, Stripe } from '@stripe/stripe-js';

// Initialize Stripe with your publishable key
// TODO: Replace with your actual Stripe publishable key
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_YOUR_KEY_HERE';

let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
};

export interface CheckoutSessionOptions {
  priceId: string;
  userId: string;
  userEmail: string;
  userToken: string;
  successUrl?: string;
  cancelUrl?: string;
}

export class StripeService {
  /**
   * Create a checkout session and redirect to Stripe
   */
  async redirectToCheckout(options: CheckoutSessionOptions): Promise<void> {
    const {
      priceId,
      userId,
      userEmail,
      userToken,
      successUrl = `${window.location.origin}/profile?success=true`,
      cancelUrl = `${window.location.origin}/upgrade?canceled=true`,
    } = options;

    try {
      // Use anon key for API gateway auth, pass user token in body for verification
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
          },
          body: JSON.stringify({
            priceId,
            userId,
            userEmail,
            userToken, // Pass JWT token for verification inside the function
            successUrl,
            cancelUrl,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          throw new Error(`Failed to create checkout session (${response.status}): ${errorText}`);
        }
        throw new Error(errorData.error || errorData.message || 'Failed to create checkout session');
      }

      const data = await response.json();

      if (!data || !data.sessionUrl) {
        throw new Error('No session URL returned from checkout');
      }

      // Redirect to Stripe Checkout URL
      window.location.href = data.sessionUrl;
    } catch (error) {
      console.error('Stripe checkout error:', error);
      throw error;
    }
  }

  /**
   * Create a customer portal session for managing subscription
   */
  async redirectToCustomerPortal(userId: string, userToken: string): Promise<void> {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create_portal_session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          userId,
          returnUrl: `${window.location.origin}/profile`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create portal session');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Customer portal error:', error);
      throw error;
    }
  }
}

export const stripeService = new StripeService();
