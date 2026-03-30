// api/generate.js — Vercel Serverless Function
// Owner's OpenAI API key is server-side ONLY.
// Users authenticate via Supabase JWT. Quota enforced per plan.

export const config = {
  api: {
    bodyParser: true,
  },
};

const PLAN_QUOTAS = {
  GUEST: 0,      // Guests must sign up
  FREE: 5,       // 5/day
  PRO: 100,      // 100/day
  STUDIO: -1,    // Unlimited (-1 = no limit)
};

export default async function handler(req, res) {
  // ── CORS ────────────────────────────────────────────────────
  const origin = process.env.ALLOWED_ORIGIN || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // ── Validate OpenAI key is configured ───────────────────────
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    console.error('OPENAI_API_KEY not configured');
    return res.status(503).json({
      error: 'AI service not configured',
      hint: 'Set OPENAI_API_KEY in your environment variables',
    });
  }

  // ── Parse + validate request body ───────────────────────────
  const {
    prompt,
    model = 'dall-e-3',
    size = '1024x1024',
    quality = 'standard',
  } = req.body || {};

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return res.status(400).json({ error: 'Prompt is required' });
  }
  if (prompt.length > 1000) {
    return res.status(400).json({ error: 'Prompt too long (max 1000 characters)' });
  }

  const allowedModels = ['dall-e-2', 'dall-e-3'];
  const allowedSizes = ['256x256', '512x512', '1024x1024', '1024x1792', '1792x1024'];
  if (!allowedModels.includes(model)) return res.status(400).json({ error: 'Invalid model' });
  if (!allowedSizes.includes(size)) return res.status(400).json({ error: 'Invalid size' });

  // ── Authenticate user via Supabase JWT ───────────────────────
  let userId = null;
  let userPlan = 'GUEST';

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith('Bearer ') && supabaseUrl && supabaseServiceKey) {
    const token = authHeader.slice(7);
    try {
      const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'apikey': supabaseServiceKey,
        },
      });
      if (userRes.ok) {
        const userData = await userRes.json();
        userId = userData.id;

        // Get user plan from profiles table
        const profileRes = await fetch(
          `${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=plan`,
          {
            headers: {
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`,
            },
          }
        );
        if (profileRes.ok) {
          const profiles = await profileRes.json();
          userPlan = profiles[0]?.plan || 'FREE';
        }
      }
    } catch (e) {
      console.error('Auth error (continuing as guest):', e.message);
    }
  }

  // ── Require sign-in for generation ──────────────────────────
  if (!userId) {
    return res.status(401).json({
      error: 'Sign up free for 5 chibi generations per day',
      signUpUrl: '/?auth=register',
      demoMode: true,
    });
  }

  // ── Check daily quota ────────────────────────────────────────
  const quota = PLAN_QUOTAS[userPlan] ?? 0;

  if (quota !== -1 && supabaseUrl && supabaseServiceKey) {
    const today = new Date().toISOString().split('T')[0];
    try {
      const quotaRes = await fetch(
        `${supabaseUrl}/rest/v1/quota_usage?user_id=eq.${userId}&date=eq.${today}&select=count,id`,
        {
          headers: {
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
        }
      );

      if (quotaRes.ok) {
        const quotaData = await quotaRes.json();
        const todayCount = quotaData[0]?.count || 0;

        if (todayCount >= quota) {
          const planNames = { FREE: 'PRO ($9.99/mo)', PRO: 'STUDIO ($24.99/mo)' };
          return res.status(429).json({
            error: `Daily limit reached (${todayCount}/${quota} generations used)`,
            current: todayCount,
            limit: quota,
            plan: userPlan,
            upgradeMessage: planNames[userPlan]
              ? `Upgrade to ${planNames[userPlan]} for more generations`
              : 'Limit reached',
          });
        }
      }
    } catch (e) {
      console.error('Quota check error (continuing):', e.message);
      // Don't block generation if quota check fails
    }
  }

  // ── Generate image with owner's OpenAI key ──────────────────
  let imageData;
  try {
    const openaiRes = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model,
        prompt: prompt.trim().substring(0, 1000),
        n: 1,
        size,
        quality: model === 'dall-e-3' ? quality : undefined,
        response_format: 'b64_json',
      }),
    });

    if (!openaiRes.ok) {
      const err = await openaiRes.json().catch(() => ({}));
      console.error('OpenAI error:', err);

      if (openaiRes.status === 429) {
        return res.status(503).json({ error: 'AI service temporarily busy — please try again in a moment' });
      }
      if (openaiRes.status === 400) {
        return res.status(400).json({ error: 'Prompt was rejected by AI safety filters — please try a different description' });
      }
      return res.status(500).json({
        error: 'Image generation failed',
        message: err.error?.message || 'Unknown error',
      });
    }

    const data = await openaiRes.json();
    imageData = data.data?.[0]?.b64_json;

    if (!imageData) {
      return res.status(500).json({ error: 'No image returned from AI' });
    }
  } catch (err) {
    console.error('OpenAI fetch error:', err);
    return res.status(500).json({ error: 'Failed to reach AI service — please try again' });
  }

  // ── Update quota usage (non-blocking) ───────────────────────
  if (supabaseUrl && supabaseServiceKey && userId && quota !== -1) {
    const today = new Date().toISOString().split('T')[0];

    // Use upsert: insert with count=1, or increment if row exists
    fetch(`${supabaseUrl}/rest/v1/quota_usage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify({
        user_id: userId,
        date: today,
        count: 1,
      }),
    }).catch(e => console.error('Quota update error (non-fatal):', e.message));
  }

  // ── Return image ─────────────────────────────────────────────
  return res.status(200).json({
    imageData,
    model,
    size,
    plan: userPlan,
  });
}
