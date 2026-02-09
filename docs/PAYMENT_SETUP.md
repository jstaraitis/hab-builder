# Premium Payment Integration - Setup Guide

## ✅ What's Been Implemented

### Frontend Components
1. **Upgrade Page** (`/upgrade`) - Full pricing page with monthly/annual toggle
   - Monthly: $9.99/month
   - Annual: $89.99/year (save 25%)
   - Feature highlights, billing toggle, Stripe checkout integration

2. **Premium Paywall** - Shown when non-premium users try to access:
   - Care Calendar (`/care-calendar`)
   - My Animals (`/my-animals`)
   - Inventory (`/inventory`)

3. **Stripe Service** - Handles checkout sessions and customer portal redirects

4. **Protected Routes** - Three-tier auth check:
   - Not logged in → Show login form
   - Logged in but not premium → Show paywall
   - Logged in + premium → Show actual content

---

## 🔧 Setup Steps (What YOU Need to Do)

### 1. Create Stripe Account
1. Go to https://stripe.com and sign up
2. Complete business verification (required for live payments)
3. Get your API keys from https://dashboard.stripe.com/apikeys

### 2. Create Stripe Products
1. Go to https://dashboard.stripe.com/products
2. Create a product called "Habitat Builder Premium"
3. Add two prices:
   - **Monthly**: $9.99/month recurring
   - **Annual**: $89.99/year recurring
4. Copy the price IDs (format: `price_xxxxxxxxxxxxx`)

### 3. Set Environment Variables
Create a `.env` file (copy from `.env.example`):

```env
# Your existing Supabase vars
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Add these Stripe vars
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
VITE_STRIPE_PRICE_ID_MONTHLY=price_xxxxxxxxxxxxx
VITE_STRIPE_PRICE_ID_ANNUAL=price_xxxxxxxxxxxxx
```

### 4. Create Supabase Edge Functions
You need two serverless functions to handle Stripe securely:

#### Function 1: `create-checkout-session`
```typescript
// supabase/functions/create-checkout-session/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from 'https://esm.sh/stripe@11.1.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2022-11-15',
})

serve(async (req) => {
  try {
    const { priceId, userId, userEmail, successUrl, cancelUrl } = await req.json()

    const session = await stripe.checkout.sessions.create({
      customer_email: userEmail,
      client_reference_id: userId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
    })

    return new Response(
      JSON.stringify({ sessionUrl: session.url }),
      { headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    )
  }
})
```

#### Function 2: `create-portal-session`
```typescript
// supabase/functions/create-portal-session/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from 'https://esm.sh/stripe@11.1.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2022-11-15',
})

serve(async (req) => {
  try {
    const { userId, returnUrl } = await req.json()

    // Get customer ID from your database using userId
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single()

    if (!profile?.stripe_customer_id) {
      throw new Error('No customer found')
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: returnUrl,
    })

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    )
  }
})
```

Deploy functions:
```bash
supabase functions deploy create-checkout-session
supabase functions deploy create-portal-session
```

Set Stripe secret key:
```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
```

### 5. Create Stripe Webhook (Critical!)
Stripe needs to notify your database when subscriptions change:

1. Go to https://dashboard.stripe.com/webhooks
2. Add endpoint: `https://your-project.supabase.co/functions/v1/stripe-webhook`
3. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `checkout.session.completed`
4. Copy the webhook signing secret

Create webhook function:
```typescript
// supabase/functions/stripe-webhook/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from 'https://esm.sh/stripe@11.1.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2022-11-15',
})

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  const body = await req.text()

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature!,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!
    )

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        await supabase
          .from('profiles')
          .update({
            is_premium: true,
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
          })
          .eq('id', session.client_reference_id)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        await supabase
          .from('profiles')
          .update({ is_premium: false })
          .eq('stripe_subscription_id', subscription.id)
        break
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400 }
    )
  }
})
```

Deploy and set secret:
```bash
supabase functions deploy stripe-webhook
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

### 6. Update Database Schema
Add Stripe columns to profiles table:

```sql
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer 
ON profiles(stripe_customer_id);
```

---

## 🧪 Testing Flow

### Test Mode (Use Stripe test keys)
1. Go to `/upgrade`
2. Click "Upgrade Now"
3. Use test card: `4242 4242 4242 4242`
4. Expiry: Any future date
5. CVC: Any 3 digits
6. Complete checkout
7. Webhook fires → `is_premium` set to `true`
8. User can now access care features

### Live Mode
1. Switch to live Stripe keys in `.env`
2. Redeploy Edge Functions with live secret key
3. Update webhook endpoint to live mode
4. Test with real card (invite friends/family for beta)

---

## 💰 Revenue Dashboard

Track payments in Stripe Dashboard:
- **Customers**: https://dashboard.stripe.com/customers
- **Subscriptions**: https://dashboard.stripe.com/subscriptions
- **Revenue**: https://dashboard.stripe.com/revenue

---

## 🚨 Important Notes

### Security
- ✅ Never expose `STRIPE_SECRET_KEY` in frontend
- ✅ Always validate webhooks with signing secret
- ✅ Use Supabase Edge Functions for all Stripe API calls

### User Experience
- Users can cancel anytime via customer portal (add button to Profile page)
- Cancellation takes effect at end of billing period
- Failed payments trigger Stripe's automatic retry logic

### Testing
- Use Stripe test mode (keys start with `pk_test_` and `sk_test_`)
- Test cards: https://stripe.com/docs/testing

### Production Checklist
- [ ] Complete Stripe business verification
- [ ] Switch to live API keys
- [ ] Update webhook to live mode
- [ ] Test full payment flow end-to-end
- [ ] Set up Stripe tax collection (if required)
- [ ] Configure email receipts in Stripe settings

---

## 🎯 Next Steps (Optional Enhancements)

1. **Add "Manage Subscription" button** to Profile page
   ```tsx
   <button onClick={() => stripeService.redirectToCustomerPortal(user.id)}>
     Manage Subscription
   </button>
   ```

2. **Show subscription status** in Profile
   - Active, Canceled, Past due
   - Next billing date
   - Cancel at period end

3. **Upgrade prompts** in free features
   - Add banners to Designer / Care guides
   - "Upgrade to save your design"

4. **Lifetime deals** (one-time payment)
   - Create a `payment` mode product instead of `subscription`
   - Set `is_premium: true` permanently

5. **Referral program**
   - Give 1 month free for each referral
   - Track via custom coupon codes

---

## 📞 Need Help?

- Stripe Docs: https://stripe.com/docs
- Supabase Edge Functions: https://supabase.com/docs/guides/functions
- Stripe Test Cards: https://stripe.com/docs/testing
- Stripe Dashboard: https://dashboard.stripe.com
