// Vercel serverless function — server-side OpenAI proxy
// Deploy to Vercel: this file becomes POST /api/generate

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", process.env.ALLOWED_ORIGIN || "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { prompt, model = "dall-e-3", size = "1024x1024", quality = "standard" } = req.body || {};

  if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  if (prompt.length > 1000) {
    return res.status(400).json({ error: "Prompt too long (max 1000 characters)" });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("OPENAI_API_KEY not configured");
    return res.status(503).json({ error: "Service not configured" });
  }

  const allowedModels = ["dall-e-2", "dall-e-3"];
  const allowedSizes = ["256x256", "512x512", "1024x1024", "1024x1792", "1792x1024"];

  if (!allowedModels.includes(model)) {
    return res.status(400).json({ error: "Invalid model" });
  }
  if (!allowedSizes.includes(size)) {
    return res.status(400).json({ error: "Invalid size" });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        prompt: prompt.trim().substring(0, 1000),
        n: 1,
        size,
        quality: model === "dall-e-3" ? quality : undefined,
        response_format: "b64_json",
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("OpenAI API error:", error);
      return res.status(response.status).json({
        error: "Image generation failed",
        message: error.error?.message || "Unknown error",
      });
    }

    const data = await response.json();
    const imageData = data.data?.[0]?.b64_json;

    if (!imageData) {
      return res.status(500).json({ error: "No image data returned" });
    }

    return res.status(200).json({ imageData, model, size });
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
