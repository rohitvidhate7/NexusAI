"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleWebhook = exports.createCheckoutSession = void 0;
const stripe_1 = __importDefault(require("stripe"));
let stripe;
if (process.env.STRIPE_SECRET_KEY) {
    stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2024-04-10',
    });
}
const createCheckoutSession = async (workspaceId, plan, email) => {
    if (!stripe)
        throw new Error('Stripe is not configured');
    // Map plan names to price IDs (these would be actual price IDs from Stripe dashboard)
    const priceMap = {
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
exports.createCheckoutSession = createCheckoutSession;
const handleWebhook = (body, signature) => {
    if (!stripe)
        throw new Error('Stripe is not configured');
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    return stripe.webhooks.constructEvent(body, signature, endpointSecret);
};
exports.handleWebhook = handleWebhook;
