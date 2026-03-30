// Vercel serverless function — Stripe checkout session creation
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", process.env.ALLOWED_ORIGIN || "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) return res.status(503).json({ error: "Billing not configured" });

  const { plan, userId } = req.body || {};
  if (!plan || !["PRO", "STUDIO"].includes(plan)) {
    return res.status(400).json({ error: "Invalid plan" });
  }

  const priceIds = {
    PRO: process.env.STRIPE_PRO_PRICE_ID,
    STUDIO: process.env.STRIPE_STUDIO_PRICE_ID,
  };

  const priceId = priceIds[plan];
  if (!priceId) return res.status(503).json({ error: "Price not configured for plan: " + plan });

  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/?upgraded=true&plan=${plan}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/?cancelled=true`,
      metadata: { userId: userId || "anonymous", plan },
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("Stripe error:", err);
    return res.status(500).json({ error: "Failed to create checkout session" });
  }
}
