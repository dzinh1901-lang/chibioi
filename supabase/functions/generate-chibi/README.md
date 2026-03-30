# generate-chibi Edge Function

Secure server-side proxy for OpenAI image generation.

## Deploy
```
supabase functions deploy generate-chibi --project-ref YOUR_PROJECT_REF
```

## Set secret
```
supabase secrets set OPENAI_API_KEY=sk-proj-your-key --project-ref YOUR_PROJECT_REF
```

## Usage
```
POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/generate-chibi
Body: { "prompt": "...", "model": "dall-e-3", "size": "1024x1024" }
Returns: { "imageData": "<base64>", "model": "...", "size": "..." }
```
