import Stripe from 'stripe';

let stripe: Stripe;

if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-04-10' as any,
  });
}

export const createCheckoutSession = async (workspaceId: string, plan: string, email: string) => {
  if (!stripe) throw new Error('Stripe is not configured');
  
  // Map plan names to price IDs (these would be actual price IDs from Stripe dashboard)
  const priceMap: Record<string, string> = {
    'Pro': 'price_pro_123',
    'Business': 'price_business_123',
    'Enterprise': 'price_enterprise_123'
  };

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    customer_email: email,
    line_items: [
      {
        price: priceMap[plan],
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: `http://localhost:5173/workspaces/${workspaceId}/settings?success=true`,
    cancel_url: `http://localhost:5173/workspaces/${workspaceId}/settings?canceled=true`,
    metadata: {
      workspaceId,
      plan
    }
  });

  return session;
};

export const handleWebhook = (body: any, signature: string) => {
  if (!stripe) throw new Error('Stripe is not configured');
  
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;
  
  return stripe.webhooks.constructEvent(body, signature, endpointSecret);
};
