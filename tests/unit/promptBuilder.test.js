// Unit tests for the avatar prompt builder logic
// These test the prompt construction without needing a browser

/**
 * Mirrors the buildAvatarPrompt logic from js/app.js
 * so it can be tested in Node without a browser environment
 */
function buildAvatarPrompt(options) {
  const {
    gender = 'girl',
    hairColor = 'brown',
    hairStyle = 'long wavy',
    eyeColor = 'brown',
    outfit = 'casual',
    background = 'soft golden glow',
    softness = 70,
    sparkle = 60,
    artStyle = 'Polished Anime',
  } = options;

  const softnessDesc = softness > 66 ? 'ultra-soft painterly style, ' : softness > 33 ? 'semi-soft style, ' : '';
  const sparkleDesc = sparkle > 66 ? 'magical golden sparkles, glowing light particles, ' : sparkle > 33 ? 'subtle sparkle effects, ' : '';

  return `chibi anime avatar, cute ${gender} character, ${hairColor} ${hairStyle} hair, ${eyeColor} eyes, wearing ${outfit} outfit, ${background} background, ${softnessDesc}${sparkleDesc}high quality anime illustration, cute chibi proportions with large expressive eyes, vivid colors, professional digital art, detailed, 1:1 square format`.trim();
}

// Simple test runner (no dependencies needed)
let passed = 0;
let failed = 0;

function assert(description, condition) {
  if (condition) {
    console.log(`  ✅ ${description}`);
    passed++;
  } else {
    console.error(`  ❌ FAILED: ${description}`);
    failed++;
  }
}

console.log('\n🧪 Prompt Builder Unit Tests\n');

// Test 1: Basic prompt contains required chibi keywords
const basic = buildAvatarPrompt({ gender: 'girl', hairColor: 'brown', outfit: 'marching band uniform' });
assert('Contains "chibi anime"', basic.includes('chibi anime'));
assert('Contains "large expressive eyes"', basic.includes('large expressive eyes'));
assert('Contains "high quality"', basic.includes('high quality'));
assert('Contains "professional digital art"', basic.includes('professional digital art'));
assert('Contains the outfit', basic.includes('marching band uniform'));

// Test 2: Sparkle effects at high value
const sparkly = buildAvatarPrompt({ sparkle: 80 });
assert('High sparkle includes golden sparkles', sparkly.includes('golden sparkles'));

// Test 3: Softness at high value
const soft = buildAvatarPrompt({ softness: 90 });
assert('High softness includes painterly', soft.includes('painterly'));

// Test 4: Low sparkle does not include sparkle text
const noSparkle = buildAvatarPrompt({ sparkle: 10 });
assert('Low sparkle has no sparkle text', !noSparkle.includes('sparkle'));

// Test 5: Prompt is a non-empty string
const result = buildAvatarPrompt({});
assert('Returns a non-empty string', typeof result === 'string' && result.length > 50);

// Test 6: Prompt length is within DALL-E limits
assert('Prompt under 1000 chars', result.length < 1000);

console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
