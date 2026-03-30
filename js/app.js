// =====================================================
// CHIBI CREATOR — MAIN REACT APP  (v4 — Full Integration)
// =====================================================
const { useState, useEffect, useRef, useCallback, createContext, useContext, useReducer } = React;

// =====================================================
// ⚙️  CONFIGURATION  — paste your OpenAI API key here
//     OR enter it at runtime via the ⚙️ Settings modal
// =====================================================
const CHIBI_CONFIG = {
  // Your OpenAI API key (sk-…).  Leave blank to use demo mode.
  // Get one at: https://platform.openai.com/api-keys
  OPENAI_API_KEY: '',

  // Model to use for image generation.
  // 'dall-e-3'      → highest quality, 1 image per call, ~$0.04/image
  // 'dall-e-2'      → faster, cheaper, ~$0.02/image
  // 'gpt-image-1'  → best for edits + multi-turn (requires org verification)
  IMAGE_MODEL: 'dall-e-3',

  // Output size: '1024x1024' | '1792x1024' | '1024x1792'
  IMAGE_SIZE: '1024x1024',

  // HD quality ('hd') or standard ('standard')  [dall-e-3 only]
  IMAGE_QUALITY: 'standard',

  // localStorage key for persisting the user-entered API key
  STORAGE_KEY: 'chibi_openai_key',
};

// Runtime key override (set via Settings modal; persists in localStorage)
function getApiKey() {
  return localStorage.getItem(CHIBI_CONFIG.STORAGE_KEY) || CHIBI_CONFIG.OPENAI_API_KEY || '';
}
function setApiKey(key) {
  if (key) localStorage.setItem(CHIBI_CONFIG.STORAGE_KEY, key.trim());
  else localStorage.removeItem(CHIBI_CONFIG.STORAGE_KEY);
}
function hasApiKey() { return Boolean(getApiKey()); }

// =====================================================
// CONSTANTS & STATIC DATA
// =====================================================

const PLAN_QUOTAS = { FREE: 5, PRO: 100, STUDIO: Infinity };

// Profession data: each entry drives the full Identity + Role + Scene + Mood stack
const PROFESSIONS = [
  {
    id: 'doctor', icon: '🩺', name: 'Doctor',
    desc: 'Clean white coat, stethoscope, warm clinical setting',
    tone: 'cute-professional',
    composition: 'seated-desk',
    scene: 'bright modern hospital room with soft monitors, clean medical workstation, subtle pastel lighting',
    props: 'stethoscope around neck, clipboard with notes, small medical kit on desk',
    mood: 'calm, reassuring, caring, competent',
    outfit: 'crisp white doctor coat over smart casual clothing, name badge',
    prompt: 'A warm and competent chibi doctor character seated at a clean clinical workstation',
  },
  {
    id: 'pastry-chef', icon: '🧁', name: 'Pastry Chef',
    desc: 'Artisanal patisserie, layered cakes, warm bakery glow',
    tone: 'cute-artisanal',
    composition: 'full-body-poster',
    scene: 'warm cozy patisserie interior with glass display cases showing macarons and cakes, soft amber lighting',
    props: 'pastry piping bag in hand, tiered cake on counter, flour dusted apron, rolling pin',
    mood: 'joyful, creative, warm, artisanal pride',
    outfit: 'tall white chef hat, classic double-breasted chef coat, apron with flour details',
    prompt: 'A joyful and skilled chibi pastry chef standing in a warm artisanal patisserie',
  },
  {
    id: 'scientist', icon: '🔬', name: 'Scientist',
    desc: 'Lab or cosmos, holographic data, intellectual warmth',
    tone: 'cute-professional',
    composition: 'seated-desk',
    scene: 'sleek science office with floating holographic data overlays, subtle cosmic elements, atom models, soft blue ambient light',
    props: 'laptop open with equations, glowing test tubes, floating formula notes, telescope or microscope nearby',
    mood: 'curious, intelligent, excited, warm',
    outfit: 'smart casual with open lab coat, small glasses, neat hair',
    prompt: 'A bright and curious chibi scientist at a high-tech research station surrounded by cosmic data',
  },
  {
    id: 'pilot', icon: '✈️', name: 'Pilot',
    desc: 'Cockpit at altitude, confident, uniform details',
    tone: 'cute-professional',
    composition: 'seated-desk',
    scene: 'detailed aircraft cockpit with instrument panels, altitude views through windshield, soft cockpit lighting',
    props: 'headset on, aviation instrument panel visible, golden wings badge on chest, flight manual',
    mood: 'confident, adventurous, focused, friendly',
    outfit: 'crisp aviation uniform, captain epaulettes, aviator sunglasses pushed up',
    prompt: 'A confident and friendly chibi pilot seated in a detailed aircraft cockpit',
  },
  {
    id: 'engineer', icon: '⚙️', name: 'Engineer',
    desc: 'Blueprints, technical precision, creative problem-solver',
    tone: 'cute-professional',
    composition: 'seated-desk',
    scene: 'modern engineering office or shipyard drafting room with blueprint drawings pinned to wall, technical monitors',
    props: 'rolled blueprints, laptop with CAD design, precision ruler, yellow hard hat on desk',
    mood: 'determined, precise, creative, warm',
    outfit: 'smart workwear, safety vest detail, sleeves rolled up',
    prompt: 'A precise and creative chibi engineer at a drafting desk surrounded by blueprints and technical tools',
  },
  {
    id: 'marching-band', icon: '🥁', name: 'Band Leader',
    desc: 'Polished parade uniform, instrument, energy and joy',
    tone: 'cute-artisanal',
    composition: 'full-body-poster',
    scene: 'colorful parade ground with confetti and bunting, soft warm stage lighting, crowd silhouette in distance',
    props: 'shiny instrument (trumpet or baton), floating musical notes, decorative ribbon details',
    mood: 'energetic, joyful, proud, showstopping',
    outfit: 'elaborate embroidered parade uniform with gold braiding, tall plumed hat, white gloves',
    prompt: 'An energetic and proud chibi band leader in a dazzling parade uniform performing on stage',
  },
  {
    id: 'barista', icon: '☕', name: 'Barista',
    desc: 'Café artistry, latte foam, warm coffee ambiance',
    tone: 'cute-artisanal',
    composition: 'seated-desk',
    scene: 'cozy specialty coffee bar with espresso machine, hanging Edison bulbs, wooden counter, latte art on display',
    props: 'espresso portafilter, latte art cup, coffee beans scattered, small chalkboard menu',
    mood: 'creative, warm, precise, personable',
    outfit: 'barista apron over casual shirt, small name badge, hair neatly tied',
    prompt: 'A skilled and warm chibi barista crafting beautiful latte art at a cozy specialty coffee bar',
  },
  {
    id: 'lifestyle-sunset', icon: '🌅', name: 'Sunset Moment',
    desc: 'Golden hour, yacht deck, warm luxury lifestyle',
    tone: 'cute-luxury-lifestyle',
    composition: 'lifestyle-portrait',
    scene: 'luxury yacht deck at golden sunset, warm amber ocean reflections, soft bokeh sea horizon, elegant railings',
    props: 'elegant glass in hand or resting on railing, soft breeze in hair, sunset light catching details',
    mood: 'serene, elegant, aspirational, romantically warm',
    outfit: 'flowing summer dress or elegant smart casual, delicate jewellery, hair moved by breeze',
    prompt: 'An elegant and serene chibi character relaxing on a luxury yacht deck at golden sunset',
  },
  {
    id: 'kimono-portrait', icon: '🌸', name: 'Kimono Portrait',
    desc: 'Delicate pastel kimono, sakura softness, gentle grace',
    tone: 'cute-delicate-pastel',
    composition: 'lifestyle-portrait',
    scene: 'soft minimalist background with floating cherry blossom petals, warm diffused pastel light, subtle bokeh',
    props: 'ornate kanzashi hair ornaments, folding fan or parasol, scattered sakura petals',
    mood: 'graceful, serene, delicate, timeless',
    outfit: 'beautifully detailed pastel kimono with floral obi belt, tabi socks and zori sandals',
    prompt: 'A graceful and delicate chibi character in a beautifully detailed pastel kimono surrounded by cherry blossom petals',
  },
  {
    id: 'cinematic-portrait', icon: '✨', name: 'Cinematic Portrait',
    desc: 'Warm amber bokeh, rich tones, editorial-style beauty',
    tone: 'cute-cinematic-warm',
    composition: 'lifestyle-portrait',
    scene: 'warm cinematic bokeh background with amber and gold tones, soft editorial studio feel, gentle depth of field',
    props: 'soft ambient rim lighting, warm catchlights in eyes, tasteful accessory detail',
    mood: 'warm, charming, editorial, emotionally rich',
    outfit: 'stylish smart casual with warm-toned palette, tasteful jewellery or accessories',
    prompt: 'A warm and charming chibi character in a cinematic editorial portrait with rich amber bokeh lighting',
  },
];

const STYLES = [
  { id: 'polished-anime',  name: 'Polished Anime',   renderDesc: 'ultra-polished anime illustration with clean confident linework, smooth cel-shaded gradient fills, luminous glossy eyes with rich iris gradients, soft blush on cheeks, precise hair strand rendering with silky highlights, premium character design quality' },
  { id: 'soft-watercolor', name: 'Soft Watercolor',  renderDesc: 'beautiful soft watercolor illustration with gentle pastel washes, translucent layered color, dreamy soft edges, delicate ink linework, warm paper texture feel, emotionally tender and painterly finish' },
  { id: 'pixel-art',       name: 'Pixel Art',        renderDesc: '16-bit retro pixel art with clean crisp pixels, carefully chosen limited palette, clear readable sprite design, nostalgic game-art aesthetic, charming and bold in thumbnail' },
  { id: '3d-render',       name: '3D Chibi Render',  renderDesc: 'adorable 3D rendered chibi with smooth rounded plastic-like surfaces, soft subsurface skin scattering, gentle ambient occlusion, studio-quality lighting, Pixar-adjacent warmth and charm' },
  { id: 'sticker-style',   name: 'Sticker Style',    renderDesc: 'clean premium sticker illustration with confident bold outlines, flat vibrant fills, crisp die-cut white border, graphic design quality, instantly readable at any size' },
  { id: 'pastel-sketch',   name: 'Pastel Sketch',    renderDesc: 'delicate hand-drawn pastel sketch with soft pencil texture, light hatching shading, gentle pastel color fills, intimate artist sketchbook feel, warm and personal' },
];

const BACKGROUNDS = [
  { id: 'soft-glow',       name: '✨ Soft Glow Studio',   gradient: 'linear-gradient(135deg,#FFF5E6,#FFE8D0,#FFDCC0)', sceneDesc: 'clean minimalist studio setting with soft warm glow, gentle bokeh light orbs, pale peach and cream tones, flattering portrait lighting — ideal for avatar and profile images' },
  { id: 'cherry-blossom',  name: '🌸 Cherry Blossom',     gradient: 'linear-gradient(135deg,#FFB7C5,#FFDDE8,#FFB0C8)', sceneDesc: 'soft springtime scene with drifting cherry blossom petals, blurred sakura branches, pale pink ambient light, delicate and romantic atmosphere' },
  { id: 'golden-sunset',   name: '🌅 Golden Sunset',       gradient: 'linear-gradient(135deg,#FFB347,#FFCC80,#FF9A5C)', sceneDesc: 'warm golden hour outdoor setting with amber bokeh, sunset light casting a warm glow, rich orange and gold tones, aspirational lifestyle feel' },
  { id: 'moonlit',         name: '🌙 Moonlit Night',       gradient: 'linear-gradient(135deg,#1a1a3e,#2d2d6e,#4a3080)', sceneDesc: 'serene nighttime scene under a full luminous moon, soft indigo and violet ambient light, scattered stars, quiet and elegant nocturnal atmosphere' },
  { id: 'cloud-kingdom',   name: '☁️ Cloud Kingdom',       gradient: 'linear-gradient(135deg,#87CEEB,#C8E8FF,#E8F6FF)', sceneDesc: 'dreamy sky scene floating among soft fluffy clouds, soft blue and white pastel palette, peaceful and whimsical with gentle depth of field' },
  { id: 'cafe-interior',   name: '☕ Cozy Café',            gradient: 'linear-gradient(135deg,#C9A96E,#E8C99A,#FFF0D6)', sceneDesc: 'warm and intimate café interior with Edison bulb lighting, wooden surfaces, hanging plants, steam from coffee cup visible, artisanal and inviting atmosphere' },
  { id: 'festival',        name: '🎪 Festival Lights',      gradient: 'linear-gradient(135deg,#FF9966,#FF8FA3,#FFCC88)', sceneDesc: 'vibrant outdoor festival setting with warm string lights, colorful lanterns, soft crowd bokeh in background, celebratory and energetic atmosphere' },
  { id: 'fantasy-castle',  name: '🏰 Fantasy Castle',       gradient: 'linear-gradient(135deg,#9B59B6,#C39BD3,#E8C4E8)', sceneDesc: 'magical fantasy castle courtyard with soft purple and gold ambient light, floating sparkles, enchanted garden elements, fairytale-elegant and aspirational setting' },
];

const SAMPLE_GALLERY = [
  { id:'g1',  title:'Dr. Sparkles 🩺',    creator:'AniArtist',   likes:142, downloads:89,  gradient:'linear-gradient(135deg,#FFB6C1 0%,#FFD6C0 50%,#FFE8B0 100%)', emoji:'🩺', liked:false, desc:'Polished Anime • Soft Glow'      },
  { id:'g2',  title:'Chef Mochi 🧁',      creator:'KawaiiMaker', likes:213, downloads:156, gradient:'linear-gradient(135deg,#B0D4FF 0%,#87CEEB 50%,#FFB6C1 100%)', emoji:'🧁', liked:false, desc:'Soft Watercolor • Cherry Blossom'},
  { id:'g3',  title:'Science Bunny 🔬',   creator:'ChibiLab',    likes:98,  downloads:67,  gradient:'linear-gradient(135deg,#C8F0B8 0%,#A8E8A0 50%,#B0F0C0 100%)', emoji:'🔬', liked:false, desc:'3D Render • Cloud Kingdom'       },
  { id:'g4',  title:'Captain Fluffy ✈️',  creator:'StarDreamer', likes:178, downloads:201, gradient:'linear-gradient(135deg,#F0C674 0%,#FFD700 50%,#FFE88A 100%)', emoji:'✈️', liked:false, desc:'Polished Anime • Soft Glow'      },
  { id:'g5',  title:'Gear Girl ⚙️',       creator:'MechChibi',   likes:89,  downloads:45,  gradient:'linear-gradient(135deg,#D4C0FF 0%,#C0B0FF 50%,#B8D0FF 100%)', emoji:'⚙️', liked:false, desc:'Sticker Style • Festival Lights' },
  { id:'g6',  title:'Band Star 🥁',       creator:'MusicPixel',  likes:267, downloads:312, gradient:'linear-gradient(135deg,#FF9AA8 0%,#FFB6C1 50%,#FFCCD5 100%)', emoji:'🥁', liked:false, desc:'Polished Anime • Festival Lights'},
  { id:'g7',  title:'Moon Healer 🌙',     creator:'AnimeStudio', likes:445, downloads:388, gradient:'linear-gradient(135deg,#1a1a3e 0%,#3d3480 50%,#7760C0 100%)', emoji:'🌙', liked:false, desc:'Polished Anime • Moonlit Night'  },
  { id:'g8',  title:'Cloud Princess ☁️',  creator:'SkyArtist',   likes:312, downloads:247, gradient:'linear-gradient(135deg,#C8E8FF 0%,#A8D8FF 50%,#87CEEB 100%)', emoji:'☁️', liked:false, desc:'Soft Watercolor • Cloud Kingdom' },
  { id:'g9',  title:'Festival Dancer 🎪', creator:'AniMagic',    likes:189, downloads:133, gradient:'linear-gradient(135deg,#FF9966 0%,#FFCC88 50%,#FF9988 100%)', emoji:'🎪', liked:false, desc:'Pastel Sketch • Festival Lights' },
  { id:'g10', title:'Castle Knight 🏰',   creator:'PixelForge',  likes:234, downloads:189, gradient:'linear-gradient(135deg,#9B59B6 0%,#C39BD3 50%,#E8C4E8 100%)', emoji:'🏰', liked:false, desc:'Polished Anime • Fantasy Castle'  },
  { id:'g11', title:'Starlight Chef 🌟',  creator:'MagicBake',   likes:156, downloads:98,  gradient:'linear-gradient(135deg,#FFD700 0%,#FFE88A 50%,#FFF5C0 100%)', emoji:'🌟', liked:false, desc:'Sticker Style • Soft Glow'       },
  { id:'g12', title:'Rainbow Pilot 🌈',   creator:'SkyDream',    likes:289, downloads:224, gradient:'linear-gradient(135deg,#FFB6C1 0%,#87CEEB 50%,#C8F0B8 100%)', emoji:'🌈', liked:false, desc:'Polished Anime • Cherry Blossom' },
];

const FAQ_ITEMS = [
  { q:'How many free generations do I get?',       a:'Free users get 5 generations per day. Pro users get 100 per day, and Studio users have unlimited generations.' },
  { q:'Can I use my chibi characters commercially?',a:'Free and Pro plans allow personal use only. The Studio plan includes a full commercial usage license.' },
  { q:'What happens to my uploaded photos?',        a:'Photos are processed in memory for chibi transformation and immediately deleted. We never store your original photos.' },
  { q:'How does photo-to-chibi work?',              a:'Our AI analyzes your photo for facial features and hairstyle, then renders a chibi character matching your appearance while applying the selected style and background.' },
  { q:'Can I cancel my subscription anytime?',      a:'Absolutely! You can cancel at any time from the billing portal. Your access continues until the end of your billing period.' },
];

// Emoji + gradient fallbacks for user-saved items
const ITEM_THEMES = [
  { emoji:'🌸', gradient:'linear-gradient(135deg,#FFB7C5,#FFDDE8,#FFB0C8)' },
  { emoji:'⭐', gradient:'linear-gradient(135deg,#FFF5E6,#FFE8D0,#FFDCC0)' },
  { emoji:'🌙', gradient:'linear-gradient(135deg,#1a1a3e,#3d3480,#7760C0)' },
  { emoji:'☁️', gradient:'linear-gradient(135deg,#C8E8FF,#A8D8FF,#87CEEB)' },
  { emoji:'✨', gradient:'linear-gradient(135deg,#FF9966,#FFCC88,#FF9988)' },
  { emoji:'🏰', gradient:'linear-gradient(135deg,#9B59B6,#C39BD3,#E8C4E8)' },
];
function itemTheme(id = '') {
  const idx = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % ITEM_THEMES.length;
  return ITEM_THEMES[idx];
}

// =====================================================
// UTILITY HOOKS
// =====================================================

function useScrolled(threshold = 10) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > threshold);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, [threshold]);
  return scrolled;
}

function useIntersection(ref, opts = {}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.1, ...opts });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return visible;
}

function useClickOutside(ref, handler) {
  useEffect(() => {
    function listener(e) { if (ref.current && !ref.current.contains(e.target)) handler(); }
    document.addEventListener('mousedown', listener);
    return () => document.removeEventListener('mousedown', listener);
  }, [handler]);
}

// =====================================================
// TABLE API HELPERS
// =====================================================

const api = {
  async get(table, params = {}) {
    const qs = new URLSearchParams(params).toString();
    const r = await fetch(`tables/${table}${qs ? '?' + qs : ''}`);
    if (!r.ok) throw new Error(`GET ${table} failed: ${r.status}`);
    return r.json();
  },
  async post(table, body) {
    const r = await fetch(`tables/${table}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!r.ok) throw new Error(`POST ${table} failed: ${r.status}`);
    return r.json();
  },
  async patch(table, id, body) {
    const r = await fetch(`tables/${table}/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!r.ok) throw new Error(`PATCH ${table}/${id} failed: ${r.status}`);
    return r.json();
  },
  async del(table, id) {
    const r = await fetch(`tables/${table}/${id}`, { method: 'DELETE' });
    if (!r.ok && r.status !== 204) throw new Error(`DELETE ${table}/${id} failed: ${r.status}`);
  },
};

// =====================================================
// AUTH CONTEXT  — full Table-API backed
// =====================================================

const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const [user, setUser]           = useState(null);
  const [authLoading, setLoading] = useState(false);

  // Restore session from localStorage on mount; re-validate against DB
  useEffect(() => { restoreSession(); }, []);

  async function restoreSession() {
    const saved = localStorage.getItem('chibi_user');
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      // Re-fetch user from DB to get latest plan
      const data = await api.get('users', { search: parsed.email, limit: 100 });
      const fresh = data.data?.find(u => u.email === parsed.email && u.id === parsed.id);
      if (fresh) {
        const u = { id: fresh.id, name: fresh.name, email: fresh.email, plan: fresh.plan || 'FREE' };
        setUser(u);
        localStorage.setItem('chibi_user', JSON.stringify(u));
      } else {
        // Record disappeared — clear stale session
        localStorage.removeItem('chibi_user');
      }
    } catch {
      // Network offline — trust cache
      setUser(JSON.parse(saved));
    }
  }

  async function login(email, password) {
    setLoading(true);
    try {
      const data = await api.get('users', { search: email, limit: 100 });
      // Match on exact email
      const found = data.data?.find(u => u.email === email.toLowerCase().trim());
      if (!found) return { success: false, error: 'No account found with that email.' };
      // Verify password: stored as btoa(password) — same encoding used on register
      if (found.passwordHash !== btoa(password)) return { success: false, error: 'Incorrect password.' };
      const u = { id: found.id, name: found.name, email: found.email, plan: found.plan || 'FREE' };
      setUser(u);
      localStorage.setItem('chibi_user', JSON.stringify(u));
      return { success: true, user: u };
    } catch (e) {
      return { success: false, error: 'Connection error. Please try again.' };
    } finally {
      setLoading(false);
    }
  }

  async function register(name, email, password) {
    setLoading(true);
    try {
      const normEmail = email.toLowerCase().trim();
      // Duplicate check
      const data = await api.get('users', { search: normEmail, limit: 100 });
      if (data.data?.find(u => u.email === normEmail)) return { success: false, error: 'Email already registered.' };
      // Create
      const newRec = await api.post('users', { name: name.trim(), email: normEmail, passwordHash: btoa(password), plan: 'FREE', createdAt: Date.now() });
      const u = { id: newRec.id, name: newRec.name, email: newRec.email, plan: 'FREE' };
      setUser(u);
      localStorage.setItem('chibi_user', JSON.stringify(u));
      return { success: true, user: u };
    } catch (e) {
      return { success: false, error: 'Registration failed. Please try again.' };
    } finally {
      setLoading(false);
    }
  }

  // Called after plan upgrade (Stripe webhook simulation)
  async function refreshUser() {
    if (!user) return;
    try {
      const data = await api.get('users', { search: user.email, limit: 100 });
      const fresh = data.data?.find(u => u.id === user.id);
      if (fresh) {
        const u = { id: fresh.id, name: fresh.name, email: fresh.email, plan: fresh.plan || 'FREE' };
        setUser(u);
        localStorage.setItem('chibi_user', JSON.stringify(u));
      }
    } catch {}
  }

  function logout() {
    setUser(null);
    localStorage.removeItem('chibi_user');
  }

  return React.createElement(AuthContext.Provider, { value: { user, authLoading, login, register, logout, refreshUser } }, children);
}

function useAuth() { return useContext(AuthContext); }

// =====================================================
// QUOTA HELPERS  — daily generation counter
// =====================================================

function todayKey() { return new Date().toISOString().slice(0, 10); } // "2025-03-27"

// ── Guest (sessionStorage) quota helpers ──
const GUEST_QUOTA_KEY   = 'chibi_guest_count';
const GUEST_DAILY_LIMIT = 3;

// =====================================================
// PREMIUM CHIBI PROMPT ENGINE  v2
// Implements the 7-layer prompt specification:
// Identity · Style · Role · Scene · Mood · Composition · Finish
// =====================================================

// Detect tone bucket from user prompt text
function detectToneBucket(text) {
  const t = (text || '').toLowerCase();
  if (/doctor|nurse|surgeon|dentist|pharmacist|therapist|vet/.test(t))         return 'cute-professional';
  if (/scientist|engineer|pilot|architect|lawyer|professor|analyst/.test(t))   return 'cute-professional';
  if (/chef|baker|barista|cook|pastry|coffee|café|cafe/.test(t))               return 'cute-artisanal';
  if (/musician|band|singer|guitarist|violinist|pianist|dj/.test(t))           return 'cute-artisanal';
  if (/yacht|sunset|dinner|luxury|elegant|wine|fine dining|ocean/.test(t))     return 'cute-luxury-lifestyle';
  if (/kimono|sakura|blossom|floral|delicate|pastel|garden|soft pink/.test(t)) return 'cute-delicate-pastel';
  if (/portrait|warm|amber|cinematic|golden|editorial|glow/.test(t))           return 'cute-cinematic-warm';
  return 'cute-professional'; // default: polished professional feel
}

// Composition framing based on tone or profession
function getCompositionGuide(composition, tone) {
  const comp = composition || 'auto';
  const effective = comp === 'auto' ? (
    tone === 'cute-luxury-lifestyle' || tone === 'cute-delicate-pastel' || tone === 'cute-cinematic-warm'
      ? 'lifestyle-portrait'
      : tone === 'cute-artisanal'
        ? 'full-body-poster'
        : 'seated-desk'
  ) : comp;

  const map = {
    'full-body-poster':  'full-body centered character composition with readable silhouette, character fills the frame confidently, decorative floating elements in background, poster-like premium layout',
    'seated-desk':       '3/4 body or upper body composition showing character at their professional workstation, environment clearly communicates role, subject is dominant focal point',
    'lifestyle-portrait':'emotionally appealing lifestyle portrait, flattering 3/4 pose, elegant atmospheric environment storytelling, subject and mood are co-equal focal points',
    'paired-scene':      'two chibi characters in harmonious paired composition, compatible styling, matching environmental lighting, warm emotional connection between subjects',
  };
  return map[effective] || map['full-body-poster'];
}

// Core premium chibi prompt builder — 7-layer architecture
function buildChibiPrompt(textPrompt, professionData, styleObj, bgObj, softness, sparkle, compositionHint) {

  // ── LAYER 1: Base rendering spec (always present) ──
  const BASE_SPEC = `Premium chibi character illustration. Oversized expressive head with large luminous anime eyes featuring rich iris gradients and glossy reflections, soft rounded cheeks with gentle blush, small delicate nose, warm friendly smile. Compact elegant body with simplified but clear anatomy, short limbs, small hands. Clean confident linework. Smooth gradient shading. Emotionally warm and instantly charming.`;

  // ── LAYER 2: Style rendering layer ──
  const styleDesc = styleObj?.renderDesc || 'ultra-polished anime illustration with clean linework, smooth shading, glossy expressive eyes';

  // ── LAYER 3: Tone bucket detection ──
  const tone = professionData?.tone || detectToneBucket(textPrompt);

  const toneGuide = {
    'cute-professional':     'The character radiates warm competence and professional charm. Expression is calm and reassuring. Clothing is neat and role-specific. Overall feel: trusted expert who is also deeply likeable.',
    'cute-artisanal':        'The character radiates creative passion and artisanal warmth. Expression is joyful and engaged. Environment tells a craft story. Overall feel: skilled maker who loves their work.',
    'cute-luxury-lifestyle': 'The character radiates elegant aspiration and peaceful confidence. Expression is serene and charming. Setting feels elevated and aspirational. Overall feel: premium lifestyle visual.',
    'cute-delicate-pastel':  'The character radiates soft feminine grace and serene beauty. Expression is gentle and quietly joyful. Palette is soft and delicate. Overall feel: collectible art-print quality.',
    'cute-cinematic-warm':   'The character radiates authentic warm charm and editorial appeal. Expression is naturally engaging. Lighting is rich and cinematic. Overall feel: social-media ready premium portrait.',
  }[tone] || '';

  // ── LAYER 4: Role / profession layer ──
  let roleBlock = '';
  if (professionData && professionData.id !== 'none') {
    roleBlock = [
      professionData.outfit   ? `Outfit: ${professionData.outfit}.`     : '',
      professionData.props    ? `Props and details: ${professionData.props}.` : '',
      professionData.mood     ? `Character mood: ${professionData.mood}.`    : '',
    ].filter(Boolean).join(' ');
  }

  // ── LAYER 5: Scene / background layer ──
  const sceneDesc = bgObj?.sceneDesc || 'clean soft pastel studio background with gentle bokeh and warm ambient light';
  const sceneBlock = professionData?.scene
    ? `Scene: ${professionData.scene}.`
    : `Background setting: ${sceneDesc}.`;

  // ── LAYER 6: Composition layer ──
  const compGuide = getCompositionGuide(compositionHint || professionData?.composition, tone);

  // ── LAYER 7: Softness / sparkle finish layer ──
  const finishParts = [];
  if (softness > 70)       finishParts.push('extremely soft dreamy rendering with gentle edge glow and painterly warmth');
  else if (softness > 40)  finishParts.push('slightly softened rendering with smooth gradients and gentle light diffusion');
  else                     finishParts.push('crisp defined rendering with clean precise linework and bold color contrast');
  if (sparkle > 70)        finishParts.push('surrounded by delicate magical sparkles and soft glowing light particles');
  else if (sparkle > 40)   finishParts.push('with subtle sparkling accent details');
  finishParts.push('No text, no watermarks, no logos. Single character only unless prompt specifies paired scene. Premium illustration quality suitable for social media avatar, creator branding, or giftable print.');

  // ── ASSEMBLE FINAL PROMPT ──
  return [
    BASE_SPEC,
    `Rendering style: ${styleDesc}.`,
    textPrompt ? `Character description: ${textPrompt}.` : '',
    roleBlock,
    sceneBlock,
    `Composition: ${compGuide}.`,
    toneGuide,
    finishParts.join(' '),
  ].filter(Boolean).join('\n\n');
}

// Convenience wrapper used by the studio (maps old API to new)
function buildChibiPromptLegacy(textPrompt, professionName, styleName, bgName, softness, sparkle) {
  const profData = PROFESSIONS.find(p => p.name === professionName) || null;
  const styleObj = STYLES.find(s => s.name === styleName)           || null;
  const bgObj    = BACKGROUNDS.find(b => b.name === bgName)         || null;
  return buildChibiPrompt(textPrompt, profData, styleObj, bgObj, softness, sparkle);
}

// Call OpenAI DALL-E to generate a chibi image — returns a data-URL string
async function generateWithOpenAI(prompt, hdQuality = false) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('NO_API_KEY');

  const body = {
    model:   CHIBI_CONFIG.IMAGE_MODEL,
    prompt,
    n:       1,
    size:    hdQuality ? '1792x1024' : CHIBI_CONFIG.IMAGE_SIZE,
    quality: hdQuality ? 'hd' : CHIBI_CONFIG.IMAGE_QUALITY,
    response_format: 'b64_json',   // get base64 → avoids CORS on URL redirect
  };

  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = err?.error?.message || `OpenAI ${res.status}`;
    throw new Error(msg);
  }

  const data = await res.json();
  const b64  = data.data?.[0]?.b64_json;
  if (!b64) throw new Error('No image data returned');
  return `data:image/png;base64,${b64}`;
}

// Photo-to-Chibi: identity-preserving prompt with strong visual cue instructions
async function photoToChibiWithOpenAI(base64DataUrl, extraPrompt, styleName, bgName, softness, sparkle) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('NO_API_KEY');

  const styleObj = STYLES.find(s => s.name === styleName) || null;
  const bgObj    = BACKGROUNDS.find(b => b.name === bgName) || null;

  // Identity-preservation layer: strong explicit instructions to retain visual identity
  const identityInstructions = [
    'Translate this person into a premium chibi character while preserving their identity.',
    'PRESERVE: hair color exactly, hairstyle and parting direction, skin tone family, any visible eye color, age impression (adult remains adult-coded chibi, not childlike), signature accessories (glasses, earrings, watch, headset, stethoscope, etc.).',
    'The result should be clearly recognizable as a chibi version of THIS specific person, not a generic anime character.',
    extraPrompt ? `Additional character details: ${extraPrompt}.` : '',
  ].filter(Boolean).join(' ');

  const fullPrompt = buildChibiPrompt(
    identityInstructions,
    null,
    styleObj,
    bgObj,
    softness,
    sparkle
  );

  return generateWithOpenAI(fullPrompt, false);
}

// Download a data-URL or remote URL as a PNG file
async function downloadImageFile(imageUrl, filename = 'chibi.png') {
  try {
    if (imageUrl.startsWith('data:')) {
      // Already base64 — direct download
      const a = document.createElement('a');
      a.href     = imageUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return true;
    }
    // Remote URL — fetch and convert to blob
    const res  = await fetch(imageUrl, { mode: 'cors' });
    if (!res.ok) throw new Error('Fetch failed');
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    return true;
  } catch {
    return false;
  }
}

// Generate a demo gradient PNG as a canvas blob (fallback for demo mode download)
async function generateDemoCanvas(emoji, gradient, size = 512) {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    // Parse gradient colors (simple linear)
    const colors = gradient.match(/#[0-9a-fA-F]{3,6}/g) || ['#FFB6C1','#87CEEB'];
    const grd = ctx.createLinearGradient(0, 0, size, size);
    colors.forEach((c, i) => grd.addColorStop(i / Math.max(colors.length - 1, 1), c));
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, size, size);
    // Draw chibi body placeholder
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    ctx.ellipse(size/2, size*0.38, size*0.24, size*0.28, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(size/2, size*0.68, size*0.18, size*0.22, 0, 0, Math.PI*2);
    ctx.fill();
    // Emoji
    ctx.font = `${size * 0.22}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji || '✨', size/2, size*0.38);
    // Label
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = `bold ${size * 0.045}px Inter, sans-serif`;
    ctx.fillText('✨ Chibi Creator — Demo Preview', size/2, size * 0.9);
    return new Promise(res => canvas.toBlob(res, 'image/png'));
  } catch { return null; }
}

// Share via Web Share API with clipboard fallback
async function shareImage(imageUrl, title = 'My Chibi Character ✨') {
  // Try Web Share API (mobile / modern browsers)
  if (navigator.share) {
    try {
      if (imageUrl && imageUrl.startsWith('data:')) {
        // Convert base64 to File for sharing
        const res  = await fetch(imageUrl);
        const blob = await res.blob();
        const file = new File([blob], 'chibi.png', { type: 'image/png' });
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ title, text: 'Check out my AI-generated chibi! ✨', files: [file] });
          return 'shared';
        }
      }
      const shareUrl = (!imageUrl || imageUrl.startsWith('data:')) ? window.location.href : imageUrl;
      await navigator.share({ title, text: 'Check out my AI-generated chibi! ✨', url: shareUrl });
      return 'shared';
    } catch (e) {
      if (e.name === 'AbortError') return 'cancelled';
      // Fall through to clipboard
    }
  }
  // Fallback: copy URL to clipboard
  const textToCopy = (!imageUrl || imageUrl.startsWith('data:')) ? window.location.href : imageUrl;
  try {
    await navigator.clipboard.writeText(textToCopy);
    return 'copied';
  } catch {
    // Last resort: prompt user
    return 'failed';
  }
}

function getGuestUsage() {
  try {
    const stored = JSON.parse(sessionStorage.getItem(GUEST_QUOTA_KEY) || 'null');
    if (stored && stored.date === todayKey()) return stored.count || 0;
    return 0;
  } catch { return 0; }
}

function incrementGuestUsage() {
  try {
    const count = getGuestUsage() + 1;
    sessionStorage.setItem(GUEST_QUOTA_KEY, JSON.stringify({ date: todayKey(), count }));
    return count;
  } catch { return 1; }
}

async function getUsageToday(userId) {
  try {
    const data = await api.get('quota_usage', { search: userId, limit: 100 });
    const today = todayKey();
    const rec = data.data?.find(r => r.userId === userId && r.date === today);
    return { count: rec?.count || 0, id: rec?.id || null };
  } catch { return { count: 0, id: null }; }
}

async function incrementUsage(userId, currentId, currentCount) {
  try {
    if (currentId) {
      await api.patch('quota_usage', currentId, { count: currentCount + 1, updatedAt: Date.now() });
    } else {
      await api.post('quota_usage', { userId, date: todayKey(), count: 1, createdAt: Date.now() });
    }
  } catch {}
}

// =====================================================
// TOAST CONTEXT
// =====================================================

const ToastContext = createContext(null);

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), duration);
  }, []);

  const removeToast = (id) => setToasts(p => p.filter(t => t.id !== id));
  const ICONS = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };

  return React.createElement(ToastContext.Provider, { value: { addToast } },
    children,
    React.createElement('div', { className: 'toast-container' },
      toasts.map(t =>
        React.createElement('div', { key: t.id, className: `toast ${t.type}` },
          React.createElement('span', { className: 'toast-icon' }, ICONS[t.type]),
          React.createElement('span', { className: 'toast-text' }, t.message),
          React.createElement('button', { onClick: () => removeToast(t.id), style: { background:'none', border:'none', cursor:'pointer', color:'#999', fontSize:'16px', padding:'0 4px' } }, '×')
        )
      )
    )
  );
}

function useToast() { return useContext(ToastContext); }

// =====================================================
// NAVBAR
// =====================================================

// =====================================================
// SETTINGS MODAL — API key configuration
// =====================================================

function SettingsModal({ onClose }) {
  const { addToast } = useToast();
  const [apiKey, setApiKey_]  = useState(() => getApiKey());
  const [model,  setModel]    = useState(CHIBI_CONFIG.IMAGE_MODEL);
  const [saved,  setSaved]    = useState(false);
  const [testing, setTesting] = useState(false);

  // Close on Escape
  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  function handleSave() {
    setApiKey(apiKey.trim());
    CHIBI_CONFIG.IMAGE_MODEL = model;
    setSaved(true);
    addToast('Settings saved! ✅', 'success');
    setTimeout(() => { setSaved(false); onClose(); }, 1200);
  }

  async function handleTestKey() {
    const key = apiKey.trim();
    if (!key) { addToast('Enter an API key first', 'warning'); return; }
    setTesting(true);
    try {
      // Minimal test: list models endpoint
      const r = await fetch('https://api.openai.com/v1/models', {
        headers: { 'Authorization': `Bearer ${key}` },
      });
      if (r.ok)       addToast('✅ API key is valid and working!', 'success');
      else if (r.status === 401) addToast('❌ Invalid API key. Check it at platform.openai.com', 'error');
      else if (r.status === 429) addToast('⚠️ Rate limited — but key is valid!', 'warning');
      else            addToast(`⚠️ Unexpected status: ${r.status}`, 'warning');
    } catch {
      addToast('⚠️ Could not reach OpenAI. Check your connection.', 'warning');
    } finally { setTesting(false); }
  }

  const keyPreview = apiKey ? `${apiKey.slice(0,7)}${'•'.repeat(Math.min(20, apiKey.length - 7))}` : '';

  return React.createElement('div', { className:'modal-overlay', onClick:onClose },
    React.createElement('div', {
      className:'modal-card',
      onClick:e=>e.stopPropagation(),
      style:{ maxWidth:'480px' }
    },
      React.createElement('button', { className:'modal-close', onClick:onClose }, '×'),
      React.createElement('div', { className:'modal-header' },
        React.createElement('div', { className:'modal-icon' }, '⚙️'),
        React.createElement('h2', { className:'modal-title' }, 'API Settings'),
        React.createElement('p', { className:'modal-subtitle' }, 'Connect your OpenAI account to generate real chibi images')
      ),

      // Key info box
      React.createElement('div', { style:{ background:'rgba(135,206,235,0.12)', border:'1px solid rgba(135,206,235,0.3)', borderRadius:'16px', padding:'16px', marginBottom:'20px', fontSize:'13px', color:'var(--text-secondary)', lineHeight:'1.6' } },
        React.createElement('div', { style:{ fontWeight:700, marginBottom:'6px', color:'var(--text-primary)' } }, '🔑 How to get your OpenAI API key:'),
        React.createElement('ol', { style:{ margin:'0', paddingLeft:'18px' } },
          React.createElement('li', null, 'Go to ', React.createElement('a', { href:'https://platform.openai.com/api-keys', target:'_blank', rel:'noopener', style:{ color:'var(--pink-dark)', fontWeight:600 } }, 'platform.openai.com/api-keys')),
          React.createElement('li', null, 'Click "Create new secret key"'),
          React.createElement('li', null, 'Copy and paste it below'),
          React.createElement('li', null, 'DALL-E 3: ~$0.04/image · DALL-E 2: ~$0.02/image')
        )
      ),

      React.createElement('div', { className:'modal-form' },
        // API Key field
        React.createElement('div', { className:'form-row' },
          React.createElement('label', { className:'input-label' }, 'OpenAI API Key'),
          React.createElement('div', { style:{ position:'relative' } },
            React.createElement('input', {
              className:'input',
              type:'password',
              placeholder:'sk-proj-...',
              value:apiKey,
              onChange:e=>setApiKey_(e.target.value),
              autoComplete:'off',
              spellCheck:false,
              style:{ fontFamily:'monospace', paddingRight:'90px' }
            }),
            React.createElement('button', {
              type:'button',
              onClick:handleTestKey,
              disabled:testing,
              style:{ position:'absolute', right:'8px', top:'50%', transform:'translateY(-50%)', background:'rgba(135,206,235,0.2)', border:'1px solid rgba(135,206,235,0.4)', borderRadius:'8px', padding:'4px 10px', fontSize:'12px', fontWeight:600, cursor:'pointer', color:'var(--text-secondary)', whiteSpace:'nowrap' }
            }, testing ? '…Testing' : 'Test Key')
          ),
          apiKey && React.createElement('div', { style:{ fontSize:'12px', color:'var(--text-muted)', marginTop:'4px' } }, `Saved: ${keyPreview}`)
        ),

        // Model selector
        React.createElement('div', { className:'form-row' },
          React.createElement('label', { className:'input-label' }, 'Image Model'),
          React.createElement('select', {
            className:'input',
            value:model,
            onChange:e=>setModel(e.target.value),
            style:{ cursor:'pointer' }
          },
            React.createElement('option', { value:'dall-e-3' }, 'DALL-E 3 — Best quality (~$0.04/image)'),
            React.createElement('option', { value:'dall-e-2' }, 'DALL-E 2 — Fast & affordable (~$0.02/image)')
          )
        ),

        // Clear key option
        apiKey && React.createElement('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 0' } },
          React.createElement('span', { style:{ fontSize:'13px', color:'var(--text-muted)' } }, 'Key stored in browser localStorage only'),
          React.createElement('button', {
            type:'button',
            onClick:()=>{ setApiKey_(''); setApiKey(''); addToast('API key cleared 🗑️','info'); },
            style:{ background:'none', border:'none', color:'#FF4466', fontSize:'12px', fontWeight:600, cursor:'pointer', padding:'4px 8px' }
          }, 'Clear Key')
        ),

        React.createElement('button', {
          className:'btn btn-gold btn-full btn-lg',
          onClick:handleSave,
          style:{ marginTop:'8px' }
        }, saved ? '✅ Saved!' : '💾 Save Settings')
      )
    )
  );
}

// =====================================================
// NAVBAR
// =====================================================

function Navbar({ onLoginClick, onRegisterClick, activeSection, onOpenSettings }) {
  const scrolled    = useScrolled();
  const { user, logout, refreshUser } = useAuth();
  const { addToast } = useToast();
  const [menuOpen,     setMenuOpen]     = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [apiKeySet,    setApiKeySet]    = useState(() => hasApiKey());
  const userMenuRef = useRef(null);
  useClickOutside(userMenuRef, () => setUserMenuOpen(false));

  // Refresh api-key indicator when settings modal closes
  useEffect(() => {
    const h = () => setApiKeySet(hasApiKey());
    window.addEventListener('chibi-settings-saved', h);
    return () => window.removeEventListener('chibi-settings-saved', h);
  }, []);

  function scrollTo(id) { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); setMenuOpen(false); }

  function handleLogout() { logout(); setUserMenuOpen(false); addToast('Signed out. See you soon! 👋', 'info'); }

  async function handleBillingPortal() {
    setUserMenuOpen(false);
    if (!user) return;
    try {
      const r = await fetch('api/billing/portal', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      const d = await r.json();
      if (d.url) window.location.href = d.url;
      else addToast('Connect Stripe to enable billing portal 💳', 'info');
    } catch { addToast('Connect Stripe to enable billing portal 💳', 'info'); }
  }

  function handleSettings() {
    setUserMenuOpen(false);
    onOpenSettings();
  }

  const planColors = {
    FREE:   'rgba(200,200,200,0.4)',
    PRO:    'linear-gradient(135deg,#FFD700,#F0C674)',
    STUDIO: 'linear-gradient(135deg,#9B59B6,#C39BD3)',
  };
  const planTextColors = { FREE: '#888', PRO: '#5A3E00', STUDIO: '#fff' };

  const navLinks = [
    { label:'Create',   id:'studio'  },
    { label:'Gallery',  id:'gallery' },
    { label:'Pricing',  id:'pricing' },
    { label:'How it Works', id:'ux' },
  ];

  return React.createElement(React.Fragment, null,
    React.createElement('nav', { className:`navbar ${scrolled?'scrolled':''}` },

      // Logo
      React.createElement('div', { className:'navbar-logo', style:{cursor:'pointer'}, onClick:()=>window.scrollTo({top:0,behavior:'smooth'}) }, '✨ Chibi Creator'),

      // Desktop links
      React.createElement('div', { className:'navbar-links' },
        navLinks.map(l => React.createElement('a', { key:l.id, className:`nav-link ${activeSection===l.id?'active':''}`, onClick:()=>scrollTo(l.id) }, l.label))
      ),

      // Auth
      React.createElement('div', { className:'navbar-actions' },
        user
          ? React.createElement(React.Fragment, null,
              React.createElement('span', { style:{fontSize:'13px',fontWeight:600,color:'var(--text-secondary)',marginRight:'4px'} }, `Hi, ${user.name.split(' ')[0]}! 👋`),
              React.createElement('span', { style:{fontSize:'10px',fontWeight:800,background:planColors[user.plan]||planColors.FREE,color:planTextColors[user.plan]||'#888',padding:'3px 10px',borderRadius:'50px',marginRight:'8px',letterSpacing:'0.06em', cursor:'pointer'}, onClick:()=>scrollTo('pricing') }, user.plan),
              React.createElement('div', { ref:userMenuRef, style:{position:'relative'} },
                React.createElement('div', { className:'user-avatar', onClick:()=>setUserMenuOpen(p=>!p) }, user.name.charAt(0).toUpperCase()),
                userMenuOpen && React.createElement('div', {
                  style:{position:'absolute',top:'48px',right:0,background:'rgba(255,245,230,0.97)',backdropFilter:'blur(20px)',border:'1px solid rgba(255,182,193,0.3)',borderRadius:'16px',boxShadow:'0 16px 48px rgba(45,45,63,0.15)',padding:'8px',minWidth:'200px',zIndex:200}
                },
                  React.createElement('div', { style:{padding:'10px 14px',fontSize:'13px',color:'var(--text-muted)',borderBottom:'1px solid rgba(255,182,193,0.2)',marginBottom:'6px'} },
                    React.createElement('div', { style:{fontWeight:700,color:'var(--text-primary)',marginBottom:'2px'} }, user.name),
                    user.email
                  ),
                  // My Gallery
                  menuBtn('🖼️ My Gallery', () => { scrollTo('gallery'); setUserMenuOpen(false); }),
                  // Billing / Upgrade
                  user.plan === 'FREE'
                    ? menuBtn('⭐ Upgrade to Pro', () => { scrollTo('pricing'); setUserMenuOpen(false); })
                    : menuBtn('💳 Billing Portal', handleBillingPortal),
                  // Settings
                  menuBtn('⚙️ Settings', handleSettings),
                  // Refresh plan
                  menuBtn('🔄 Refresh Plan', async () => { await refreshUser(); addToast('Plan refreshed ✅', 'success'); setUserMenuOpen(false); }),
                  React.createElement('div', { style:{borderTop:'1px solid rgba(255,182,193,0.2)',marginTop:'6px',paddingTop:'4px'} }),
                  menuBtn('🚪 Sign Out', handleLogout, '#FF4466')
                )
              )
            )
          : React.createElement(React.Fragment, null,
              React.createElement('button', { className:'btn btn-outline btn-sm', onClick:onLoginClick }, 'Log In'),
              React.createElement('button', { className:'btn btn-primary btn-sm', onClick:onRegisterClick }, 'Sign Up Free')
            )
      ),

      // API key indicator + settings shortcut
      React.createElement('button', {
        title: apiKeySet ? 'OpenAI connected — click to change settings' : 'No API key — click to add your OpenAI key',
        onClick: onOpenSettings,
        style:{ background:'none', border:`1.5px solid ${apiKeySet ? 'rgba(135,206,235,0.6)' : 'rgba(255,182,193,0.4)'}`, borderRadius:'8px', padding:'5px 10px', cursor:'pointer', fontSize:'14px', display:'flex', alignItems:'center', gap:'4px', color: apiKeySet ? '#4a9aba' : 'var(--text-muted)', transition:'all 0.2s' },
        onMouseEnter:e=>e.currentTarget.style.background='rgba(255,182,193,0.1)',
        onMouseLeave:e=>e.currentTarget.style.background='none',
      },
        apiKeySet ? '🔑' : '⚙️',
        React.createElement('span', { style:{ fontSize:'11px', fontWeight:600 } }, apiKeySet ? 'AI Ready' : 'Setup')
      ),

      // Hamburger
      React.createElement('div', { className:'hamburger', onClick:()=>setMenuOpen(p=>!p) },
        React.createElement('span'), React.createElement('span'), React.createElement('span')
      )
    ),

    // Mobile menu
    React.createElement('div', { className:`mobile-menu ${menuOpen?'open':''}` },
      navLinks.map(l => React.createElement('a', { key:l.id, className:'mobile-nav-link', onClick:()=>scrollTo(l.id) }, l.label)),
      React.createElement('div', { style:{borderTop:'1px solid rgba(255,182,193,0.2)',paddingTop:'12px',marginTop:'8px',display:'flex',gap:'8px'} },
        !user
          ? React.createElement(React.Fragment, null,
              React.createElement('button', { className:'btn btn-outline btn-sm', style:{flex:1}, onClick:()=>{onLoginClick();setMenuOpen(false);} }, 'Log In'),
              React.createElement('button', { className:'btn btn-primary btn-sm', style:{flex:1}, onClick:()=>{onRegisterClick();setMenuOpen(false);} }, 'Sign Up')
            )
          : React.createElement('button', { className:'btn btn-outline btn-sm', style:{flex:1}, onClick:handleLogout }, 'Sign Out')
      )
    )
  );
}

function menuBtn(label, onClick, color = 'var(--text-primary)') {
  return React.createElement('button', {
    key: label,
    style:{display:'block',width:'100%',padding:'10px 14px',background:'none',border:'none',textAlign:'left',cursor:'pointer',fontSize:'14px',fontWeight:600,color,borderRadius:'10px',transition:'all 0.2s'},
    onClick,
    onMouseEnter: e => e.currentTarget.style.background='rgba(255,182,193,0.1)',
    onMouseLeave: e => e.currentTarget.style.background='none',
  }, label);
}

// =====================================================
// HERO SECTION
// =====================================================

function HeroSection({ onStartCreating }) {
  const sparkles = ['✨','⭐','🌟','💫','✦','★'];
  const particles = Array.from({length:15},(_,i)=>({
    id:i, emoji:sparkles[i%sparkles.length],
    left:`${10+(i*7)%80}%`, top:`${5+(i*11)%85}%`,
    delay:`${(i*0.4)%4}s`, duration:`${3+(i*0.5)%4}s`, size:`${14+(i*3)%14}px`,
  }));

  return React.createElement('section',{className:'hero',id:'hero'},
    React.createElement('div',{className:'hero-bg'}),
    React.createElement('div',{className:'hero-glow-1'}),
    React.createElement('div',{className:'hero-glow-2'}),
    React.createElement('div',{className:'hero-glow-3'}),
    React.createElement('div',{className:'chibi-float chibi-float-1'}),
    React.createElement('div',{className:'chibi-float chibi-float-2'}),
    React.createElement('div',{className:'chibi-float chibi-float-3'}),
    React.createElement('div',{className:'chibi-float chibi-float-4'}),
    React.createElement('div',{className:'sparkle-container'},
      particles.map(p=>React.createElement('span',{key:p.id,className:'sparkle',style:{left:p.left,top:p.top,fontSize:p.size,animationDelay:p.delay,animationDuration:p.duration}},p.emoji))
    ),
    React.createElement('div',{className:'hero-content'},
      React.createElement('div',{className:'hero-badge'},React.createElement('span',null,'✨'),React.createElement('span',null,'Premium Chibi Identity Engine · DALL‑E 3')),
      React.createElement('h1',{className:'hero-title display-text'},'Your Premium Chibi Character, Instantly'),
      React.createElement('p',{className:'hero-subtitle'},'Transform yourself, your profession, or any persona into a beautifully stylized chibi portrait — social-ready, identity-preserving, and genuinely premium.'),
      React.createElement('div',{className:'hero-cta'},
        React.createElement('button',{className:'btn btn-gold btn-lg',onClick:onStartCreating},'✨ Create My Chibi — Free'),
        React.createElement('button',{className:'btn btn-outline btn-lg',onClick:()=>document.getElementById('gallery')?.scrollIntoView({behavior:'smooth'})},'💫 See Examples')
      ),
      React.createElement('div',{className:'hero-stats'},
        [{num:'DALL‑E 3',label:'AI Engine'},{num:'10',label:'Presets'},{num:'6',label:'Art Styles'},{num:'Free',label:'To Start'}]
          .map(s=>React.createElement('div',{key:s.label,className:'hero-stat'},
            React.createElement('div',{className:'hero-stat-num'},s.num),
            React.createElement('div',{className:'hero-stat-label'},s.label)
          ))
      )
    )
  );
}

// =====================================================
// CREATION STUDIO
// =====================================================

function CreationStudio({ onOpenAuth, onOpenSettings }) {
  const { user }    = useAuth();
  const { addToast } = useToast();

  const [activeTab,           setActiveTab]           = useState('text');
  const [textPrompt,          setTextPrompt]          = useState('');
  const [uploadedPhotoUrl,    setUploadedPhotoUrl]    = useState(null);
  const [selectedProfession,  setSelectedProfession]  = useState(null);
  const [selectedStyle,       setSelectedStyle]       = useState('polished-anime');
  const [selectedBackground,  setSelectedBackground]  = useState('soft-glow');
  const [softness,            setSoftness]            = useState(75);
  const [sparkle,             setSparkle]             = useState(80);
  const [generating,          setGenerating]          = useState(false);
  const [generatedResult,     setGeneratedResult]     = useState(null);
  const [isDragOver,          setIsDragOver]          = useState(false);
  const [quotaInfo,           setQuotaInfo]           = useState({ count:0, id:null, loaded:false });
  const [showSignInNudge,     setShowSignInNudge]     = useState(false);
  const [genTimer,            setGenTimer]            = useState(0);
  const [lightboxOpen,        setLightboxOpen]        = useState(false);
  const genTimerRef = useRef(null);

  const fileInputRef = useRef(null);
  const sectionRef   = useRef(null);
  const visible      = useIntersection(sectionRef);

  // Keyboard shortcut: Escape to clear result / close nudge
  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') {
        if (showSignInNudge) setShowSignInNudge(false);
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [showSignInNudge]);

  // Load today's quota when user changes
  useEffect(() => {
    if (user) {
      getUsageToday(user.id).then(q => setQuotaInfo({ ...q, loaded: true }));
    } else {
      // Guest: read from sessionStorage
      setQuotaInfo({ count: getGuestUsage(), id: null, loaded: true });
    }
  }, [user]);

  const dailyLimit    = user ? (PLAN_QUOTAS[user.plan] || 5) : GUEST_DAILY_LIMIT;
  const quotaRemaining = dailyLimit === Infinity ? '∞' : Math.max(0, dailyLimit - quotaInfo.count);
  const quotaExhausted = dailyLimit !== Infinity && quotaInfo.count >= dailyLimit;

  function selectProfession(p) {
    const deselecting = p.id === selectedProfession?.id;
    setSelectedProfession(deselecting ? null : p);
    if (!deselecting) setTextPrompt(p.prompt);
  }

  function handleFileUpload(file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) { addToast('Please upload a JPG, PNG, or WebP image', 'error'); return; }
    if (file.size > 10 * 1024 * 1024) { addToast('Image must be under 10 MB', 'error'); return; }
    const reader = new FileReader();
    reader.onload = e => setUploadedPhotoUrl(e.target.result);
    reader.readAsDataURL(file);
    addToast('Photo ready! Click "Transform to Chibi" 🎨', 'success');
  }

  // Rotating loading messages to reassure users during the ~10s wait
  const LOADING_MSGS = [
    'Sketching the outline…',
    'Adding big sparkly eyes…',
    'Choosing the perfect outfit…',
    'Painting with AI magic…',
    'Adding sparkle effects…',
    'Fine-tuning the details…',
    'Almost ready… ✨',
  ];

  async function handleGenerate() {
    // Quota check
    if (quotaInfo.loaded && quotaExhausted) {
      if (!user) {
        addToast(`You've used your ${GUEST_DAILY_LIMIT} free tries! Sign in for 5/day free 🌟`, 'warning');
        setShowSignInNudge(true);
      } else {
        addToast(`Daily limit of ${dailyLimit} reached. Upgrade for more! 🌟`, 'warning');
        document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

    // Photo-to-chibi: require Pro plan (guests & free users see friendly gate)
    if (activeTab === 'photo' && (!user || user.plan === 'FREE')) {
      addToast('Photo-to-Chibi is a Pro feature — sign in & upgrade to unlock 📸', 'warning');
      document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    const finalPrompt = textPrompt.trim() || selectedProfession?.prompt || 'A cute adorable chibi character';
    if (!finalPrompt && activeTab === 'text' && !selectedProfession) {
      addToast('Enter a description or pick a profession preset ✏️', 'warning');
      return;
    }

    setGenerating(true);
    setGeneratedResult(null);
    setLightboxOpen(false);
    // Start elapsed timer
    setGenTimer(0);
    genTimerRef.current = setInterval(() => setGenTimer(t => t + 1), 1000);

    const styleObj  = STYLES.find(s => s.id === selectedStyle) || STYLES[0];
    const styleName  = styleObj.name;
    const bg         = BACKGROUNDS.find(b => b.id === selectedBackground) || BACKGROUNDS[0];
    const bgName     = bg.name;

    try {
      // --- Save PENDING record to generations table (non-fatal) ---
      const genRecord = await api.post('generations', {
        userId:         user?.id || 'anonymous',
        prompt:         finalPrompt,
        profession:     selectedProfession?.name || 'general',
        style:          styleName,
        background:     bgName,
        softness,
        sparkle,
        sourceImageUrl: uploadedPhotoUrl ? '[uploaded]' : '',
        outputImageUrl: '',
        status:         'PENDING',
        createdAt:      Date.now(),
      }).catch(() => ({ id: 'local-' + Date.now() }));

      let outputImageUrl = null;
      let isDemo         = false;
      let errorMessage   = null;

      try {
        const apiKey = getApiKey();

        if (!apiKey) {
          // No API key configured — demo mode
          isDemo = true;
        } else if (activeTab === 'photo' && uploadedPhotoUrl) {
          // Photo-to-Chibi via OpenAI
          addToast('🎨 Transforming your photo...', 'info');
          outputImageUrl = await photoToChibiWithOpenAI(
            uploadedPhotoUrl, finalPrompt, styleName, bgName, softness, sparkle
          );
        } else {
          // Text-to-Chibi via premium 7-layer prompt engine
          const fullPrompt = buildChibiPrompt(
            finalPrompt,
            selectedProfession || null,
            styleObj,
            bg,
            softness,
            sparkle
          );
          outputImageUrl = await generateWithOpenAI(fullPrompt);
        }
      } catch (genErr) {
        if (genErr.message === 'NO_API_KEY') {
          isDemo = true;
        } else if (genErr.message?.includes('invalid_api_key') || genErr.message?.includes('Incorrect API key')) {
          errorMessage = 'Invalid OpenAI API key. Please check your key in ⚙️ Settings.';
          isDemo = true;
        } else if (genErr.message?.includes('billing') || genErr.message?.includes('quota') || genErr.message?.includes('insufficient_quota')) {
          errorMessage = 'OpenAI billing limit reached. Please check your account at platform.openai.com.';
          isDemo = true;
        } else if (genErr.message?.includes('content_policy') || genErr.message?.includes('safety')) {
          errorMessage = 'Prompt blocked by safety filter. Try a different description.';
          isDemo = true;
        } else {
          errorMessage = `OpenAI error: ${genErr.message}`;
          isDemo = true;
        }
      }

      // --- Update generation record (non-fatal) ---
      if (genRecord?.id && !genRecord.id.startsWith('local-')) {
        api.patch('generations', genRecord.id, {
          outputImageUrl: outputImageUrl || '',
          status:         isDemo ? 'DEMO' : 'SUCCEEDED',
          updatedAt:      Date.now(),
        }).catch(() => {});
      }

      // --- Increment daily quota (non-fatal) ---
      if (user) {
        incrementUsage(user.id, quotaInfo.id, quotaInfo.count).catch(() => {});
      } else {
        incrementGuestUsage();
      }
      setQuotaInfo(q => ({ ...q, count: q.count + 1 }));

      setGeneratedResult({
        id:             genRecord?.id || 'local-' + Date.now(),
        prompt:         finalPrompt,
        imageUrl:       outputImageUrl,
        isDemo,
        demoGradient:   bg?.gradient || 'linear-gradient(135deg,#FFB6C1,#87CEEB)',
        demoEmoji:      selectedProfession?.icon || '✨',
        styleName,
        bgName,
        professionName: selectedProfession?.name || 'Custom',
        profession:     selectedProfession,
      });

      if (errorMessage) {
        addToast(errorMessage, 'error');
      } else if (isDemo) {
        addToast('✨ Demo mode — enter your OpenAI key in ⚙️ Settings for real images!', 'info');
      } else {
        addToast('Your chibi was created! ✨', 'success');
      }

      // Show soft sign-in nudge for guests after first successful generation
      if (!user) setShowSignInNudge(true);

    } catch (err) {
      addToast('Something went wrong — please try again 🙏', 'error');
      console.warn('[ChibiCreator] Generation error:', err?.message);
    } finally {
      setGenerating(false);
      clearInterval(genTimerRef.current);
      setGenTimer(0);
    }
  }

  async function handleSaveToGallery() {
    if (!user) {
      setShowSignInNudge(true);
      addToast('Sign in to save your chibi to the gallery 🎨', 'info');
      return;
    }
    if (!generatedResult) return;
    try {
      await api.post('gallery', {
        userId:      user.id,
        creatorName: user.name,
        title:       `${generatedResult.professionName} Chibi`,
        imageUrl:    generatedResult.imageUrl || 'demo',
        prompt:      generatedResult.prompt,
        style:       generatedResult.styleName,
        background:  generatedResult.bgName,
        visibility:  'PUBLIC',
        likes:       0,
        downloads:   0,
        generationId: generatedResult.id,
        demoGradient: generatedResult.demoGradient,
        demoEmoji:    generatedResult.demoEmoji,
        createdAt:   Date.now(),
      });
      addToast('Saved to your gallery! ✨', 'success');
    } catch { addToast('Failed to save. Try again.', 'error'); }
  }

  async function handleDownload(hd = false) {
    if (!generatedResult) return;
    if (hd && (!user || user.plan === 'FREE')) {
      addToast('HD export requires Pro plan — upgrade below 🌟', 'warning');
      document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    if (generatedResult.imageUrl && !generatedResult.isDemo) {
      addToast('Preparing download... ⬇️', 'info');
      const filename = `chibi-${(generatedResult.professionName || 'character').toLowerCase().replace(/\s+/g,'-')}-${hd?'4k':'std'}.png`;
      const ok = await downloadImageFile(generatedResult.imageUrl, filename);
      if (ok) {
        addToast(hd ? '4K HD download started! ⬇️' : 'Download started! ⬇️', 'success');
        api.patch('generations', generatedResult.id, { downloads: 1 }).catch(() => {});
      } else {
        // Last resort: open in new tab
        window.open(generatedResult.imageUrl, '_blank');
        addToast('Opened image in new tab — right-click to save 🖱️', 'info');
      }
    } else if (generatedResult.isDemo) {
      // Demo mode: download a canvas-generated placeholder
      addToast('Generating demo preview image...', 'info');
      const blob = await generateDemoCanvas(
        generatedResult.demoEmoji || '✨',
        generatedResult.demoGradient || 'linear-gradient(135deg,#FFB6C1,#87CEEB)'
      );
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a   = document.createElement('a');
        a.href     = url;
        a.download = `chibi-demo-${generatedResult.professionName || 'character'}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 5000);
        addToast('Demo preview downloaded! Add your API key for real AI images. 🔑', 'success');
      } else {
        addToast('Add your OpenAI API key in ⚙️ Settings for real images!', 'info');
        onOpenSettings?.();
      }
    } else {
      addToast('Add your OpenAI API key in ⚙️ Settings to download real images!', 'info');
      onOpenSettings?.();
    }
  }

  async function handleShare() {
    if (!generatedResult) return;
    const imageUrl = generatedResult.imageUrl && !generatedResult.isDemo ? generatedResult.imageUrl : null;
    if (!imageUrl) {
      addToast('Add your OpenAI API key in ⚙️ Settings to generate shareable images!', 'info');
      onOpenSettings?.();
      return;
    }
    const result = await shareImage(imageUrl, `My ${generatedResult.professionName} Chibi ✨`);
    if      (result === 'shared')    addToast('Shared! ✨', 'success');
    else if (result === 'copied')    addToast('Link copied to clipboard! 🔗', 'success');
    else if (result === 'cancelled') { /* user cancelled share sheet */ }
    else                              addToast('Could not share — try downloading instead', 'warning');
  }

  function handleCopyLink() {
    const url = generatedResult?.imageUrl && !generatedResult.isDemo ? generatedResult.imageUrl : window.location.href;
    navigator.clipboard.writeText(url)
      .then(() => addToast('Link copied! 🔗', 'success'))
      .catch(() => addToast('Copy failed — try Ctrl+C', 'error'));
  }

  function handleExportMeta() {
    if (!generatedResult) return;
    const meta = { id: generatedResult.id, prompt: generatedResult.prompt, style: generatedResult.styleName, background: generatedResult.bgName, softness, sparkle, profession: generatedResult.professionName, generatedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(meta, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `chibi-meta-${generatedResult.id}.json`;
    a.click();
    addToast('Metadata exported as JSON 📄', 'success');
  }

  // ── Studio result lightbox ──
  const studioLightbox = lightboxOpen && generatedResult && generatedResult.imageUrl && !generatedResult.isDemo
    ? React.createElement('div',{
        style:{position:'fixed',inset:0,background:'rgba(0,0,0,0.88)',zIndex:5000,display:'flex',alignItems:'center',justifyContent:'center',padding:'24px',animation:'fadeIn 0.2s ease'},
        onClick:()=>setLightboxOpen(false)
      },
        React.createElement('div',{style:{position:'relative',maxWidth:'90vmin',maxHeight:'90vmin'},onClick:e=>e.stopPropagation()},
          React.createElement('img',{src:generatedResult.imageUrl,alt:'Generated chibi',style:{width:'100%',height:'100%',objectFit:'contain',borderRadius:'20px',boxShadow:'0 24px 80px rgba(0,0,0,0.6)'}}),
          React.createElement('button',{onClick:()=>setLightboxOpen(false),style:{position:'absolute',top:'-14px',right:'-14px',width:'40px',height:'40px',borderRadius:'50%',background:'white',border:'none',fontSize:'20px',cursor:'pointer',boxShadow:'0 4px 16px rgba(0,0,0,0.2)',display:'flex',alignItems:'center',justifyContent:'center'}},'×'),
          React.createElement('div',{style:{position:'absolute',bottom:'12px',right:'12px',display:'flex',gap:'8px'}},
            React.createElement('button',{className:'btn btn-glass btn-sm',onClick:()=>handleDownload(false)},'⬇️ Download'),
            React.createElement('button',{className:'btn btn-glass btn-sm',onClick:handleShare},'🔗 Share')
          )
        )
      )
    : null;

  return React.createElement(React.Fragment, null,
    studioLightbox,
    React.createElement('section',{className:'studio-section',id:'studio',ref:sectionRef},
    React.createElement('div',{className:'container'},

      React.createElement('div',{className:`section-header fade-in-up ${visible?'visible':''}`},
        React.createElement('div',{className:'section-badge'},'🎨 CREATION STUDIO'),
        React.createElement('h2',{className:'section-title'},'Design Your Perfect Chibi'),
        React.createElement('p',{className:'section-subtitle'},'Choose a profession preset or describe your own character — our premium prompt engine handles identity, scene, mood, and finish automatically.'),

        // API key banner when no key is set
        !hasApiKey() && React.createElement('div',{style:{display:'inline-flex',alignItems:'center',gap:'10px',background:'rgba(240,198,116,0.15)',border:'1px dashed rgba(240,198,116,0.5)',borderRadius:'14px',padding:'10px 18px',marginTop:'12px',fontSize:'13px',color:'var(--text-secondary)',flexWrap:'wrap',justifyContent:'center',cursor:'pointer'},onClick:()=>onOpenSettings?.()},
          React.createElement('span',{style:{fontSize:'18px'}},'🔑'),
          React.createElement('span',null,'No API key — running in demo mode.'),
          React.createElement('span',{style:{fontWeight:700,color:'var(--gold-warm)',textDecoration:'underline'}},'Click here to add your OpenAI key for real images →')
        )
      ),


      // Quota bar
      React.createElement('div',{style:{textAlign:'center',marginBottom:'24px'}},
        React.createElement('div',{style:{display:'inline-flex',alignItems:'center',gap:'10px',background:'rgba(255,255,255,0.8)',backdropFilter:'blur(10px)',border:'1px solid rgba(255,182,193,0.3)',borderRadius:'50px',padding:'8px 20px',fontSize:'13px',fontWeight:600,color:'var(--text-secondary)',flexWrap:'wrap',justifyContent:'center'}},
          React.createElement('span',null, user ? '✨ Generations today:' : '🎁 Free generations:'),
          React.createElement('span',{style:{color: quotaExhausted ? '#FF4466' : 'var(--gold-warm)', fontWeight:800}},
            quotaInfo.loaded
              ? quotaExhausted
                ? (dailyLimit === Infinity ? '∞' : `${dailyLimit} used`)
                : (dailyLimit === Infinity ? '∞ available' : `${quotaRemaining} left today`)
              : '…'
          ),
          !user && !quotaExhausted && React.createElement('span',{style:{color:'var(--text-muted)',fontSize:'12px',fontWeight:400}},`· ${dailyLimit} free/day`),
          !user && React.createElement('button',{
            style:{background:'linear-gradient(135deg,#F0C674,#FFB6C1)',border:'none',borderRadius:'20px',padding:'3px 12px',fontSize:'12px',fontWeight:700,color:'white',cursor:'pointer',marginLeft:'4px'},
            onClick:()=>onOpenAuth('register')
          },'Sign in for 5/day →')
        )
      ),

      // Sign-in nudge banner (appears after first guest generation)
      showSignInNudge && !user && React.createElement('div',{style:{
        background:'linear-gradient(135deg,rgba(255,182,193,0.15),rgba(240,198,116,0.1))',
        border:'1px solid rgba(255,182,193,0.35)',
        borderRadius:'20px',padding:'16px 22px',marginBottom:'24px',
        display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'12px'
      }},
        React.createElement('div',{style:{display:'flex',alignItems:'center',gap:'12px'}},
          React.createElement('span',{style:{fontSize:'24px'}},'✨'),
          React.createElement('div',null,
            React.createElement('div',{style:{fontWeight:700,color:'var(--text-primary)',fontSize:'14px'}},'Love your chibi? Save it!'),
            React.createElement('div',{style:{color:'var(--text-secondary)',fontSize:'13px',marginTop:'2px'}},'Create a free account to save, download, and share your creations.')
          )
        ),
        React.createElement('div',{style:{display:'flex',gap:'8px',flexShrink:0}},
          React.createElement('button',{
            className:'btn btn-primary btn-sm',
            onClick:()=>onOpenAuth('register')
          },'Sign Up Free'),
          React.createElement('button',{
            className:'btn btn-outline btn-sm',
            onClick:()=>onOpenAuth('login')
          },'Log In'),
          React.createElement('button',{
            style:{background:'none',border:'none',color:'var(--text-muted)',cursor:'pointer',fontSize:'18px',padding:'0 4px'},
            onClick:()=>setShowSignInNudge(false),
            title:'Dismiss'
          },'×')
        )
      ),

      React.createElement('div',{className:'studio-layout'},

        // ── LEFT CONTROLS ──
        React.createElement('div',{className:'studio-controls'},

          // Tab panel
          React.createElement('div',{className:'studio-panel'},
            React.createElement('div',{className:'tab-switcher'},
              React.createElement('button',{className:`tab-btn ${activeTab==='text'?'active':''}`,onClick:()=>setActiveTab('text')},'📝 Text to Chibi'),
              React.createElement('button',{className:`tab-btn ${activeTab==='photo'?'active':''}`,onClick:()=>setActiveTab('photo')},
                '📸 Photo to Chibi',
                (!user || user?.plan === 'FREE') && React.createElement('span',{className:'pro-badge',style:{marginLeft:'6px'}},'PRO')
              )
            ),

            // Text tab
            React.createElement('div',{className:`tab-content ${activeTab==='text'?'active':''}`},
              React.createElement('label',{className:'input-label'},'Describe Your Character'),
              React.createElement('div',{style:{position:'relative'}},
                React.createElement('textarea',{
                  className:'input textarea',
                  placeholder:'e.g. A cheerful nurse with pink hair holding a clipboard and a stethoscope',
                  value:textPrompt,
                  onChange:e=>setTextPrompt(e.target.value),
                  maxLength:500,
                  onKeyDown:e=>{ if (e.ctrlKey && e.key==='Enter') handleGenerate(); }
                }),
                React.createElement('div',{style:{position:'absolute',bottom:'10px',right:'12px',fontSize:'11px',color:'var(--text-muted)'}},`${textPrompt.length}/500 · Ctrl+Enter`)
              ),
              // Example prompts — clickable chips matching premium tone buckets
              React.createElement('div',{style:{marginTop:'10px'}},
                React.createElement('div',{style:{fontSize:'11px',color:'var(--text-muted)',fontWeight:600,marginBottom:'6px',textTransform:'uppercase',letterSpacing:'0.06em'}},'Quick ideas — click to use:'),
                React.createElement('div',{style:{display:'flex',flexWrap:'wrap',gap:'6px'}},
                  [
                    'A warm and kind pediatric nurse with soft brown eyes and curly hair 🩺',
                    'An elegant architect with glasses reviewing blueprints at her drafting table 🏗️',
                    'A passionate barista with pastel pink hair crafting latte art at a cozy café ☕',
                    'A confident female pilot in full uniform seated in a sunlit cockpit ✈️',
                    'A graceful violinist in a concert dress performing under warm stage lights 🎻',
                    'A serene woman relaxing on a yacht deck at golden sunset with ocean views 🌅',
                  ].map(ex => React.createElement('button',{
                    key:ex,
                    onClick:()=>setTextPrompt(ex),
                    style:{background:'rgba(255,182,193,0.12)',border:'1px solid rgba(255,182,193,0.3)',borderRadius:'20px',padding:'4px 12px',fontSize:'12px',fontWeight:500,color:'var(--text-secondary)',cursor:'pointer',transition:'all 0.15s',whiteSpace:'nowrap'},
                    onMouseEnter:e=>{e.currentTarget.style.background='rgba(255,182,193,0.25)';e.currentTarget.style.borderColor='rgba(255,182,193,0.6)';},
                    onMouseLeave:e=>{e.currentTarget.style.background='rgba(255,182,193,0.12)';e.currentTarget.style.borderColor='rgba(255,182,193,0.3)';}
                  },ex))
                )
              )
            ),

            // Photo tab
            React.createElement('div',{className:`tab-content ${activeTab==='photo'?'active':''}`},
              // Honest disclaimer
              React.createElement('div',{style:{background:'rgba(135,206,235,0.12)',border:'1px solid rgba(135,206,235,0.3)',borderRadius:'12px',padding:'10px 14px',marginBottom:'14px',fontSize:'12px',color:'var(--text-secondary)',lineHeight:'1.5'}},
                React.createElement('strong',null,'💡 How it works: '),
                'Upload a photo and describe extra features. The AI reads your description + any visual details it can infer, then generates a chibi in that style. Results are inspired by, not an exact copy of, your photo.'
              ),
              !uploadedPhotoUrl
                ? React.createElement('div',{
                    className:`upload-zone ${isDragOver?'dragover':''}`,
                    onClick:()=>fileInputRef.current?.click(),
                    onDragOver:e=>{e.preventDefault();setIsDragOver(true);},
                    onDragLeave:()=>setIsDragOver(false),
                    onDrop:e=>{e.preventDefault();setIsDragOver(false);handleFileUpload(e.dataTransfer.files[0]);}
                  },
                    React.createElement('div',{className:'upload-icon'},'☁️'),
                    React.createElement('p',{className:'upload-text'},'Drop your photo here or click to browse'),
                    React.createElement('p',{className:'upload-subtext'},'JPG, PNG, WebP — max 10 MB'),
                    React.createElement('input',{type:'file',ref:fileInputRef,accept:'image/*',style:{display:'none'},onChange:e=>handleFileUpload(e.target.files[0])})
                  )
                : React.createElement('div',{style:{textAlign:'center'}},
                    React.createElement('div',{className:'upload-preview',style:{display:'inline-block'}},
                      React.createElement('img',{src:uploadedPhotoUrl,alt:'Uploaded',style:{width:'120px',height:'120px',objectFit:'cover',borderRadius:'16px',border:'3px solid var(--pink)'}}),
                      React.createElement('div',{className:'upload-preview-remove',onClick:()=>setUploadedPhotoUrl(null)},'×')
                    ),
                    React.createElement('p',{style:{fontSize:'13px',color:'var(--text-muted)',marginTop:'12px'}},'✅ Photo ready to transform!'),
                    React.createElement('label',{className:'input-label',style:{marginTop:'16px'}},'Add extra description (optional)'),
                    React.createElement('textarea',{className:'input textarea',style:{minHeight:'80px'},placeholder:'e.g. with pastel pink hair, wearing cat ears...',value:textPrompt,onChange:e=>setTextPrompt(e.target.value)})
                  )
            )
          ),

          // Profession Presets — all 10
          React.createElement('div',{className:'control-group'},
            React.createElement('div',{className:'control-group-title'},'🎭 Character Presets'),
            React.createElement('div',{style:{fontSize:'12px',color:'var(--text-muted)',marginBottom:'10px',lineHeight:'1.4'}},'Each preset loads a full scene, mood, outfit and props. Your text description layers on top.'),

            React.createElement('div',{className:'presets-grid'},
              PROFESSIONS.map(p=>React.createElement('div',{
                key:p.id,
                className:`preset-card ${selectedProfession?.id===p.id?'selected':''}`,
                onClick:()=>selectProfession(p)
              },
                React.createElement('div',{className:'preset-icon'},p.icon),
                React.createElement('div',{className:'preset-name'},p.name),
                React.createElement('div',{className:'preset-desc'},p.desc)
              ))
            )
          ),

          // Style selection
          React.createElement('div',{className:'control-group'},
            React.createElement('div',{className:'control-group-title'},'🎨 Rendering Style'),
            React.createElement('div',{style:{fontSize:'12px',color:'var(--text-muted)',marginBottom:'10px'}},STYLES.find(s=>s.id===selectedStyle)?.renderDesc?.slice(0,80)+'…'),

            React.createElement('div',{className:'style-pills'},
              STYLES.map(s=>React.createElement('button',{
                key:s.id,
                className:`style-pill ${selectedStyle===s.id?'selected':''}`,
                onClick:()=>setSelectedStyle(s.id)
              },s.name))
            )
          ),

          // Background
          React.createElement('div',{className:'control-group'},
            React.createElement('div',{className:'control-group-title'},'🌅 Scene & Background'),
            React.createElement('div',{style:{fontSize:'12px',color:'var(--text-muted)',marginBottom:'10px'}},BACKGROUNDS.find(b=>b.id===selectedBackground)?.sceneDesc?.slice(0,80)+'…'),

            React.createElement('div',{className:'bg-grid'},
              BACKGROUNDS.map(bg=>React.createElement('div',{
                key:bg.id,
                className:`bg-card ${selectedBackground===bg.id?'selected':''}`,
                onClick:()=>setSelectedBackground(bg.id)
              },
                React.createElement('div',{className:'bg-preview',style:{background:bg.gradient}}),
                React.createElement('div',{className:'bg-label'},bg.name)
              ))
            )
          ),

          // Sliders
          React.createElement('div',{className:'control-group'},
            React.createElement('div',{className:'control-group-title'},'✨ Finish & Mood'),

            React.createElement('div',{style:{display:'flex',flexDirection:'column',gap:'20px'}},
              [
                {label:'🌸 Softness',     val:softness, set:setSoftness, lo:'Crisp',   hi:'Dreamy'},
                {label:'💫 Sparkle & Glow',val:sparkle,  set:setSparkle,  lo:'Subtle', hi:'Magical ✨'},
              ].map(s=>React.createElement('div',{key:s.label,className:'slider-row'},
                React.createElement('div',{className:'slider-header'},
                  React.createElement('span',{className:'slider-label'},s.label),
                  React.createElement('span',{className:'slider-value'},`${s.val}%`)
                ),
                React.createElement('input',{type:'range',className:'slider-input',min:0,max:100,value:s.val,onChange:e=>s.set(Number(e.target.value))}),
                React.createElement('div',{className:'slider-desc'},React.createElement('span',null,s.lo),React.createElement('span',null,s.hi))
              ))
            )
          )
        ),

        // ── RIGHT RESULT PANEL ──
        React.createElement('div',{className:'studio-result-panel'},
          React.createElement('div',{className:'gen-result'},

            // Image area
            React.createElement('div',{className:'gen-image-area'},
              generating
                ? React.createElement('div',{className:'gen-loading'},
                    React.createElement('div',{style:{fontSize:'40px',marginBottom:'12px',animation:'spin 3s linear infinite'}},'✨'),
                    React.createElement('div',{className:'gen-loading-text',style:{fontSize:'15px',fontWeight:700,marginBottom:'6px'}},
                      LOADING_MSGS[Math.min(Math.floor(genTimer/3), LOADING_MSGS.length-1)]
                    ),
                    React.createElement('div',{style:{fontSize:'13px',color:'var(--text-muted)',marginBottom:'16px'}},
                      genTimer > 0 ? `${genTimer}s elapsed — DALL‑E 3 takes 8–20s` : 'Sending to DALL‑E 3…'
                    ),
                    React.createElement('div',{style:{width:'80%',height:'4px',background:'rgba(255,182,193,0.2)',borderRadius:'4px',margin:'0 auto',overflow:'hidden'}},
                      React.createElement('div',{style:{height:'100%',background:'linear-gradient(90deg,var(--pink),var(--gold))',borderRadius:'4px',width:`${Math.min(95, genTimer * 5)}%`,transition:'width 1s ease'}})
                    ),
                    React.createElement('div',{style:{display:'flex',gap:'6px',justifyContent:'center',marginTop:'16px'}},
                      [0,1,2].map(i=>React.createElement('div',{key:i,style:{width:'8px',height:'8px',borderRadius:'50%',background:'var(--pink)',animation:`bounce 1.2s ease-in-out ${i*0.2}s infinite`}}))
                    )
                  )
                : generatedResult
                  ? generatedResult.imageUrl && !generatedResult.isDemo
                    ? React.createElement('img',{
                        src:generatedResult.imageUrl,
                        alt:'Generated chibi',
                        title:'Click to enlarge',
                        style:{width:'100%',height:'100%',objectFit:'cover',cursor:'zoom-in'},
                        onClick:()=>setLightboxOpen(true)
                      })
                    : React.createElement('div',{style:{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',background:generatedResult.demoGradient,position:'relative',overflow:'hidden'}},
                        React.createElement('div',{style:{width:'120px',height:'140px',borderRadius:'60px 60px 50px 50px',background:'rgba(255,255,255,0.35)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'48px',marginBottom:'-20px'}},(generatedResult.profession?.icon||'✨')),
                        React.createElement('div',{style:{width:'80px',height:'80px',borderRadius:'50%',background:'rgba(255,255,255,0.25)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'36px'}},'😊'),
                        React.createElement('div',{style:{position:'absolute',bottom:'20px',left:0,right:0,textAlign:'center',fontSize:'11px',color:'rgba(255,255,255,0.7)',fontWeight:600}},'✨ AI Generated Chibi Preview'),
                        ['✨','🌟','💫'].map((s,i)=>React.createElement('span',{key:i,style:{position:'absolute',fontSize:'18px',opacity:0.6,top:`${20+i*25}%`,left:i%2===0?'10%':'80%'}},s))
                      )
                  : React.createElement('div',{className:'gen-placeholder'},
                      React.createElement('div',{className:'gen-placeholder-icon'},'🎨'),
                      React.createElement('div',{className:'gen-placeholder-text'},'Your chibi will appear here'),
                      React.createElement('div',{style:{marginTop:'8px',fontSize:'12px',color:'var(--text-muted)'}},'Configure settings and click Generate')
                    )
            ),

            // Generate button
            React.createElement('div',{style:{padding:'16px',borderTop:'1px solid rgba(255,182,193,0.15)'}},
              React.createElement('button',{
                className:'btn btn-gold btn-full btn-lg',
                onClick: quotaExhausted && !user ? ()=>onOpenAuth('register') : handleGenerate,
                disabled: generating || (quotaExhausted && !!user),
                title: quotaExhausted ? (user ? `Daily limit of ${dailyLimit} reached` : 'Sign in for more free generations') : ''
              },
                generating
                  ? React.createElement(React.Fragment,null,React.createElement('span',{className:'spinner'}),'Generating...')
                  : quotaExhausted
                    ? (user ? '🚫 Daily Limit Reached — Upgrade' : '🔓 Sign In for More Free Chibis')
                    : activeTab==='photo' ? '🎨 Transform to Chibi' : '✨ Generate Chibi — Free'
              )
            ),

            // Post-generation actions
            generatedResult && React.createElement(React.Fragment,null,
              React.createElement('div',{className:'gen-actions'},
                React.createElement('button',{className:'btn btn-glass btn-sm',onClick:()=>handleDownload(false)},'⬇️ PNG'),
                React.createElement('button',{className:'btn btn-glass btn-sm',onClick:()=>handleDownload(true),title:'Pro plan required'},'⬇️ HD ',React.createElement('span',{className:'pro-badge'},'PRO')),
                React.createElement('button',{className:'btn btn-glass btn-sm',onClick:handleSaveToGallery},'🖼️ Save'),
                React.createElement('button',{className:'btn btn-glass btn-sm',onClick:handleShare},'🔗 Share'),
                React.createElement('button',{className:'btn btn-glass btn-sm',onClick:handleCopyLink},'📋 Copy'),
                React.createElement('button',{className:'btn btn-glass btn-sm',onClick:handleExportMeta,title:'Export generation metadata as JSON'},'📄'),
                generatedResult && !generatedResult.isDemo && React.createElement('button',{className:'btn btn-glass btn-sm',onClick:()=>setLightboxOpen(true),title:'Enlarge image'},'🔍 Zoom'),
                React.createElement('button',{className:'btn btn-outline btn-sm',onClick:handleGenerate,style:{marginLeft:'auto'},title:'Regenerate'},'🔄 Again'),
                !hasApiKey() && React.createElement('button',{className:'btn btn-glass btn-sm',onClick:()=>onOpenSettings?.(),title:'Add OpenAI API key for real images'},'🔑 Add Key')
              ),
              React.createElement('div',{className:'gen-meta'},
                React.createElement('span',null,'🎨 ',STYLES.find(s=>s.id===selectedStyle)?.name),
                React.createElement('span',null,'🌅 ',BACKGROUNDS.find(b=>b.id===selectedBackground)?.name),
                selectedProfession && React.createElement('span',null,selectedProfession.icon,' ',selectedProfession.name),
                React.createElement('span',null,'🌸 Softness: ',softness,'%'),
                React.createElement('span',null,'✨ Sparkle: ',sparkle,'%'),
                generatedResult.id && React.createElement('span',{style:{fontSize:'10px',color:'var(--text-muted)'}},'ID: ',generatedResult.id.slice(-8))
              )
            )
          )
        )
      )
    )
    ) // end section
  ); // end Fragment
}

// =====================================================
// GALLERY SECTION
// =====================================================

function GallerySection() {
  const { user }    = useAuth();
  const { addToast } = useToast();

  const [activeFilter,  setActiveFilter]  = useState('all');
  const [sampleItems,   setSampleItems]   = useState(SAMPLE_GALLERY);
  const [publicItems,   setPublicItems]   = useState([]);
  const [userItems,     setUserItems]     = useState([]);
  const [dbLoading,     setDbLoading]     = useState(false);
  const [lightboxItem,  setLightboxItem]  = useState(null);

  const sectionRef = useRef(null);
  const visible    = useIntersection(sectionRef);

  // Load public gallery from DB on mount
  useEffect(() => { loadPublicGallery(); }, []);
  // Load user gallery whenever user changes
  useEffect(() => { if (user) loadUserGallery(); else setUserItems([]); }, [user]);

  async function loadPublicGallery() {
    setDbLoading(true);
    try {
      const data = await api.get('gallery', { limit: 50, sort: 'created_at' });
      const rows = (data.data || []).filter(r => r.visibility === 'PUBLIC');
      setPublicItems(rows.map(r => normalizeItem(r)));
    } catch {} finally { setDbLoading(false); }
  }

  async function loadUserGallery() {
    try {
      const data = await api.get('gallery', { search: user.id, limit: 100 });
      const rows = (data.data || []).filter(r => r.userId === user.id);
      setUserItems(rows.map(r => normalizeItem(r)));
    } catch {}
  }

  // Normalise a DB row → display item
  function normalizeItem(r) {
    const th = itemTheme(r.id);
    return {
      id:        r.id,
      title:     r.title || 'Chibi Character',
      creator:   r.creatorName || 'Community',
      imageUrl:  r.imageUrl,
      gradient:  r.demoGradient || th.gradient,
      emoji:     r.demoEmoji    || th.emoji,
      likes:     Number(r.likes)     || 0,
      downloads: Number(r.downloads) || 0,
      liked:     false,
      desc:      [r.style, r.background].filter(Boolean).join(' • '),
      userId:    r.userId,
      visibility:r.visibility,
    };
  }

  // Merge samples + DB public items (deduplicated by id)
  const allPublic = [
    ...sampleItems,
    ...publicItems.filter(p => !sampleItems.find(s => s.id === p.id)),
  ];

  const displayItems =
    activeFilter === 'mine'     ? userItems :
    activeFilter === 'trending' ? [...allPublic].sort((a,b)=>b.likes-a.likes) :
    allPublic;

  // Like: optimistic update + persist to DB for real items
  async function handleLike(item) {
    const toggle = (list, set) =>
      set(list.map(i => i.id === item.id ? { ...i, likes: i.liked ? i.likes-1 : i.likes+1, liked: !i.liked } : i));
    toggle(sampleItems, setSampleItems);
    toggle(publicItems,  setPublicItems);
    toggle(userItems,    setUserItems);

    // Persist if it's a real DB record
    if (!item.id.startsWith('g')) {
      const newLikes = item.liked ? item.likes - 1 : item.likes + 1;
      await api.patch('gallery', item.id, { likes: Math.max(0, newLikes) }).catch(() => {});
    }
    addToast(item.liked ? '💔 Unliked' : '❤️ Liked!', 'success');
  }

  // Delete own item
  async function handleDelete(item) {
    if (!user || item.userId !== user.id) { addToast('You can only delete your own chibis', 'error'); return; }
    try {
      await api.del('gallery', item.id);
      setUserItems(p => p.filter(i => i.id !== item.id));
      setPublicItems(p => p.filter(i => i.id !== item.id));
      addToast('Deleted from gallery 🗑️', 'info');
    } catch { addToast('Delete failed', 'error'); }
  }

  // Toggle visibility
  async function handleToggleVisibility(item) {
    if (!user || item.userId !== user.id) return;
    const next = item.visibility === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC';
    try {
      await api.patch('gallery', item.id, { visibility: next });
      const upd = i => i.id === item.id ? { ...i, visibility: next } : i;
      setUserItems(p => p.map(upd));
      setPublicItems(p => p.map(upd));
      addToast(`Set to ${next} ${next==='PUBLIC'?'🌍':'🔒'}`, 'success');
    } catch { addToast('Update failed', 'error'); }
  }

  function GalleryCard({ item }) {
    const th = itemTheme(item.id);
    const isOwner = user && user.id === item.userId;
    return React.createElement('div',{className:`gallery-card fade-in-up ${visible?'visible':''}`,style:{position:'relative'}},
      React.createElement('div',{className:'gallery-image',onClick:()=>setLightboxItem(item)},
        item.imageUrl && item.imageUrl !== 'demo'
          ? React.createElement('img',{src:item.imageUrl,alt:item.title,loading:'lazy'})
          : React.createElement('div',{style:{width:'100%',height:'100%',background:item.gradient||th.gradient,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:'8px',position:'relative',overflow:'hidden'}},
              React.createElement('div',{style:{position:'absolute',top:'10px',left:'12px',fontSize:'14px',opacity:0.6}},'✨'),
              React.createElement('div',{style:{position:'absolute',top:'15px',right:'14px',fontSize:'12px',opacity:0.5}},'⭐'),
              React.createElement('div',{style:{width:'70px',height:'85px',borderRadius:'35px 35px 30px 30px',background:'rgba(255,255,255,0.25)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'38px',backdropFilter:'blur(4px)'}},(item.emoji||th.emoji)),
              React.createElement('div',{style:{fontSize:'10px',color:'rgba(255,255,255,0.85)',fontWeight:700,letterSpacing:'0.04em'}},'✨ AI CHIBI'),
              item.desc && React.createElement('div',{style:{fontSize:'9px',color:'rgba(255,255,255,0.6)',maxWidth:'90%',textAlign:'center'}},item.desc)
            ),
        React.createElement('div',{className:'gallery-overlay'},
          React.createElement('button',{className:'gallery-overlay-btn',onClick:e=>{e.stopPropagation();setLightboxItem(item);}},'🔍'),
          React.createElement('button',{className:'gallery-overlay-btn',onClick:e=>{e.stopPropagation();handleLike(item);}},(item.liked?'❤️':'🤍')),
          isOwner && React.createElement('button',{className:'gallery-overlay-btn',onClick:e=>{e.stopPropagation();handleToggleVisibility(item);},title:'Toggle visibility'},(item.visibility==='PUBLIC'?'🌍':'🔒')),
          isOwner && React.createElement('button',{className:'gallery-overlay-btn',onClick:e=>{e.stopPropagation();handleDelete(item);},title:'Delete',style:{background:'rgba(255,68,102,0.85)'}},'🗑️')
        )
      ),
      React.createElement('div',{className:'gallery-info'},
        React.createElement('div',{className:'gallery-title'},item.title),
        React.createElement('div',{className:'gallery-meta-row'},
          React.createElement('span',{className:'gallery-creator'},`by ${item.creator}`),
          React.createElement('div',{className:'gallery-stats'},
            React.createElement('span',{className:`gallery-stat ${item.liked?'liked':''}`,onClick:()=>handleLike(item)},(item.liked?'❤️':'🤍'),' ',item.likes),
            React.createElement('span',{className:'gallery-stat'},'⬇️ ',item.downloads)
          )
        )
      )
    );
  }

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!lightboxItem) return;
    function handleKey(e) {
      if (e.key === 'Escape') { setLightboxItem(null); return; }
      const items = displayItems;
      const idx   = items.findIndex(i => i.id === lightboxItem.id);
      if (e.key === 'ArrowRight' && idx < items.length - 1) setLightboxItem(items[idx + 1]);
      if (e.key === 'ArrowLeft'  && idx > 0)                setLightboxItem(items[idx - 1]);
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [lightboxItem, displayItems]);

  return React.createElement('section',{className:'gallery-section',id:'gallery',ref:sectionRef},
    React.createElement('div',{className:'container'},
      React.createElement('div',{className:`section-header fade-in-up ${visible?'visible':''}`},
        React.createElement('div',{className:'section-badge'},'🖼️ COMMUNITY GALLERY'),
        React.createElement('h2',{className:'section-title'},'✨ Community Chibi Gallery'),
        React.createElement('p',{className:'section-subtitle'},'Discover amazing chibi characters created by our community.')
      ),

      // Filters
      React.createElement('div',{className:'gallery-filters'},
        [{key:'all',label:'✨ All'},{key:'trending',label:'🔥 Trending'},{key:'mine',label:'🎨 My Chibis'}]
          .map(f=>React.createElement('button',{key:f.key,className:`filter-btn ${activeFilter===f.key?'active':''}`,onClick:()=>setActiveFilter(f.key)},f.label))
      ),

      // Grid
      React.createElement('div',{className:'gallery-grid'},
        activeFilter==='mine' && !user
          ? React.createElement('div',{className:'gallery-empty'},
              React.createElement('div',{className:'gallery-empty-icon'},'🔒'),
              React.createElement('div',{className:'gallery-empty-text'},'Sign in to see your collection'),
              React.createElement('div',{className:'gallery-empty-sub'},'Create an account to save and manage your chibi gallery')
            )
          : activeFilter==='mine' && userItems.length===0
            ? React.createElement('div',{className:'gallery-empty'},
                React.createElement('div',{className:'gallery-empty-icon'},'🎨'),
                React.createElement('div',{className:'gallery-empty-text'},'Your gallery is empty!'),
                React.createElement('div',{className:'gallery-empty-sub'},'Create your first chibi and save it to your gallery'),
                React.createElement('button',{className:'btn btn-primary',onClick:()=>document.getElementById('studio')?.scrollIntoView({behavior:'smooth'})},'✨ Create Your First Chibi')
              )
            : displayItems.length === 0 && dbLoading
              ? React.createElement('div',{className:'gallery-empty'},React.createElement('div',{className:'gallery-empty-icon'},'⏳'),React.createElement('div',{className:'gallery-empty-text'},'Loading gallery...'))
              : displayItems.map((item,idx)=>React.createElement(GalleryCard,{key:item.id,item:{...item},idx}))
      ),

      activeFilter!=='mine' && React.createElement('div',{style:{textAlign:'center',marginTop:'40px'}},
        React.createElement('button',{className:'btn btn-outline btn-lg',onClick:loadPublicGallery},'🔄 Refresh Gallery')
      )
    ),

    // Lightbox
    lightboxItem && React.createElement('div',{className:'lightbox',onClick:()=>setLightboxItem(null)},
      React.createElement('div',{className:'lightbox-content',onClick:e=>e.stopPropagation()},
        lightboxItem.imageUrl && lightboxItem.imageUrl!=='demo'
          ? React.createElement('img',{src:lightboxItem.imageUrl,alt:lightboxItem.title,className:'lightbox-img'})
          : React.createElement('div',{style:{width:'100%',aspectRatio:'1',borderRadius:'24px',background:lightboxItem.gradient||'linear-gradient(135deg,#FFB6C1,#87CEEB)',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:'16px',position:'relative',overflow:'hidden'}},
              React.createElement('div',{style:{position:'absolute',top:'20px',left:'24px',fontSize:'24px',opacity:0.6}},'✨'),
              React.createElement('div',{style:{position:'absolute',top:'25px',right:'28px',fontSize:'20px',opacity:0.5}},'⭐'),
              React.createElement('div',{style:{width:'140px',height:'170px',borderRadius:'70px 70px 60px 60px',background:'rgba(255,255,255,0.3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'80px',backdropFilter:'blur(8px)'}},(lightboxItem.emoji||'✨')),
              React.createElement('div',{style:{fontSize:'16px',color:'rgba(255,255,255,0.9)',fontWeight:700}},'✨ AI Generated Chibi')
            ),
        React.createElement('button',{className:'lightbox-close',onClick:()=>setLightboxItem(null)},'×'),
        // Lightbox navigation arrows
        React.createElement(React.Fragment,null,
          displayItems.findIndex(i=>i.id===lightboxItem.id) > 0 &&
            React.createElement('button',{
              onClick:e=>{e.stopPropagation();const idx=displayItems.findIndex(i=>i.id===lightboxItem.id);setLightboxItem(displayItems[idx-1]);},
              style:{position:'absolute',left:'12px',top:'50%',transform:'translateY(-50%)',background:'rgba(255,255,255,0.15)',backdropFilter:'blur(8px)',border:'1px solid rgba(255,255,255,0.2)',borderRadius:'50%',width:'44px',height:'44px',cursor:'pointer',fontSize:'20px',display:'flex',alignItems:'center',justifyContent:'center',color:'white'}
            },'‹'),
          displayItems.findIndex(i=>i.id===lightboxItem.id) < displayItems.length-1 &&
            React.createElement('button',{
              onClick:e=>{e.stopPropagation();const idx=displayItems.findIndex(i=>i.id===lightboxItem.id);setLightboxItem(displayItems[idx+1]);},
              style:{position:'absolute',right:'12px',top:'50%',transform:'translateY(-50%)',background:'rgba(255,255,255,0.15)',backdropFilter:'blur(8px)',border:'1px solid rgba(255,255,255,0.2)',borderRadius:'50%',width:'44px',height:'44px',cursor:'pointer',fontSize:'20px',display:'flex',alignItems:'center',justifyContent:'center',color:'white'}
            },'›')
        ),
        React.createElement('div',{style:{marginTop:'16px',textAlign:'center'}},
          React.createElement('div',{style:{fontSize:'18px',fontWeight:700,color:'white',marginBottom:'4px'}},lightboxItem.title),
          React.createElement('div',{style:{fontSize:'14px',color:'rgba(255,255,255,0.7)',marginBottom:'12px'}},`by ${lightboxItem.creator} · ❤️ ${lightboxItem.likes} likes`),
          // Download button in lightbox
          lightboxItem.imageUrl && lightboxItem.imageUrl !== 'demo' &&
            React.createElement('button',{
              className:'btn btn-glass btn-sm',
              onClick:async e=>{
                e.stopPropagation();
                const ok = await downloadImageFile(lightboxItem.imageUrl, `${lightboxItem.title.replace(/[^a-zA-Z0-9]/g,'-')}.png`);
                if (!ok) window.open(lightboxItem.imageUrl, '_blank');
              }
            },'⬇️ Download')
        )
      )
    )
  );
}

// =====================================================
// UX SHOWCASE
// =====================================================

function UXSection() {
  const sectionRef = useRef(null);
  const visible    = useIntersection(sectionRef);
  const features   = [
    {icon:'⚡',title:'Instant Generation',    desc:'Results in under 10 seconds with our optimized AI pipeline backed by OpenAI and GPU-accelerated Stable Diffusion XL.'},
    {icon:'🎨',title:'Deep Customization',    desc:'Fine-tune every detail from softness to sparkle intensity, choosing from 6 art styles and 6 magical backgrounds.'},
    {icon:'📱',title:'Mobile First',          desc:'Create on any device with our responsive touch-optimized interface. No app download required — runs in your browser.'},
    {icon:'🔒',title:'Your Privacy',          desc:'Photos are processed in memory and immediately deleted. Your art belongs to you. No training on user photos, ever.'},
  ];
  return React.createElement('section',{className:'ux-section',id:'ux',ref:sectionRef},
    React.createElement('div',{className:'container'},
      React.createElement('div',{className:`section-header fade-in-up ${visible?'visible':''}`},
        React.createElement('div',{className:'section-badge'},'💡 UX SHOWCASE'),
        React.createElement('h2',{className:'section-title'},'Designed for Delight'),
        React.createElement('p',{className:'section-subtitle'},'Every interaction is crafted to feel magical, from first click to final download.')
      ),
      React.createElement('div',{className:'ux-grid'},
        features.map((f,i)=>React.createElement('div',{key:f.title,className:`ux-card fade-in-up ${visible?'visible':''}`,style:{transitionDelay:`${i*0.1}s`}},
          React.createElement('div',{className:'ux-icon'},f.icon),
          React.createElement('h3',{className:'ux-title'},f.title),
          React.createElement('p',{className:'ux-desc'},f.desc)
        ))
      )
    )
  );
}

// =====================================================
// ARCHITECTURE SECTION
// =====================================================

function ArchSection() {
  const sectionRef = useRef(null);
  const visible    = useIntersection(sectionRef);
  const layers = [
    {label:'FRONTEND',   color:'#87CEEB', nodes:[{icon:'⚛️',title:'React + Next.js',        desc:'App Router, SSR, ISR'},{icon:'🎨',title:'CSS Design System',     desc:'Glassmorphism, animations'},{icon:'🖱️',title:'Framer Motion',           desc:'Smooth interactions'}]},
    {label:'API LAYER',  color:'#FFB6C1', nodes:[{icon:'🔌',title:'Next.js API Routes',      desc:'Edge-optimized endpoints'},{icon:'🔐',title:'JWT Auth + Sessions',     desc:'Secure cookie sessions'},{icon:'⚡',title:'Rate Limiting',            desc:'Plan-based throttling'}]},
    {label:'AI ENGINE',  color:'#F0C674', nodes:[{icon:'🤖',title:'OpenAI gpt-image-1',      desc:'Primary generation model'},{icon:'🎭',title:'Stable Diffusion XL',     desc:'GPU fallback engine'},{icon:'🔍',title:'Real-ESRGAN Upscaler',     desc:'4K HD export pipeline'}]},
    {label:'DATA LAYER', color:'#C8F0B8', nodes:[{icon:'🗄️',title:'PostgreSQL + Prisma',    desc:'Typed ORM & migrations'},{icon:'⚡',title:'Redis Cache',               desc:'Rankings & session cache'},{icon:'☁️',title:'Cloudflare R2 Storage', desc:'Edge-distributed assets'}]},
    {label:'BILLING',    color:'#D4C0FF', nodes:[{icon:'💳',title:'Stripe Subscriptions',    desc:'FREE / PRO / STUDIO plans'},{icon:'🔔',title:'Webhook Processing',       desc:'Real-time plan updates'},{icon:'📊',title:'Usage Tracking',          desc:'Per-user quotas & analytics'}]},
  ];
  const techStack = ['Next.js 15','React 18','TypeScript','Prisma ORM','PostgreSQL','Redis','OpenAI API','Stable Diffusion XL','Real-ESRGAN','Stripe','JWT','Cloudflare R2','Docker','BullMQ','Vercel Edge'];

  return React.createElement('section',{className:'arch-section',id:'architecture',ref:sectionRef},
    React.createElement('div',{className:'container',style:{position:'relative',zIndex:1}},
      React.createElement('div',{className:`section-header fade-in-up ${visible?'visible':''}`},
        React.createElement('div',{className:'section-badge'},'🏗️ TECHNICAL ARCHITECTURE'),
        React.createElement('h2',{className:'section-title'},'Under the Hood'),
        React.createElement('p',{className:'section-subtitle',style:{color:'rgba(255,255,255,0.6)'}},'Production-grade infrastructure powering thousands of daily generations.')
      ),
      React.createElement('div',{className:`arch-layers fade-in-up ${visible?'visible':''}`},
        layers.map((layer,li)=>React.createElement(React.Fragment,{key:layer.label},
          React.createElement('div',{className:'arch-layer'},
            React.createElement('div',{className:'arch-layer-label',style:{color:layer.color}},layer.label),
            React.createElement('div',{className:'arch-nodes'},
              layer.nodes.map(n=>React.createElement('div',{key:n.title,className:'arch-node',style:{borderColor:`${layer.color}30`}},
                React.createElement('div',{className:'arch-node-icon'},n.icon),
                React.createElement('div',{className:'arch-node-title'},n.title),
                React.createElement('div',{className:'arch-node-desc'},n.desc)
              ))
            )
          ),
          li<layers.length-1 && React.createElement('div',{className:'arch-connector',style:{color:layer.color+'60'}},'↓')
        ))
      ),
      React.createElement('div',{className:'arch-layer-colors'},
        techStack.map(t=>React.createElement('span',{key:t,className:'tech-pill'},t))
      )
    )
  );
}

// =====================================================
// PRICING SECTION
// =====================================================

function PricingSection() {
  const { user, refreshUser } = useAuth();
  const { addToast }          = useToast();
  const [isAnnual, setIsAnnual] = useState(false);
  const [openFaq,  setOpenFaq]  = useState(null);
  const [upgrading,setUpgrading]= useState(null);
  const sectionRef = useRef(null);
  const visible    = useIntersection(sectionRef);

  const plans = [
    { id:'FREE',   icon:'🌱', name:'Free',   monthly:0,     annual:0,
      cta:'Get Started Free', featured:false,
      features:[
        {text:'5 generations per day',          included:true},
        {text:'Standard quality (1024×1024)',   included:true},
        {text:'Text-to-chibi only',             included:true},
        {text:'Community gallery access',       included:true},
        {text:'Photo-to-chibi',                 included:false},
        {text:'HD export (2048×2048)',           included:false},
        {text:'All styles & backgrounds',       included:false},
      ],
    },
    { id:'PRO',    icon:'⭐', name:'Pro',    monthly:9.99,  annual:7.99,
      cta:'Upgrade to Pro ✨', featured:true,
      features:[
        {text:'100 generations per day',        included:true},
        {text:'HD quality (2048×2048)',          included:true},
        {text:'Photo-to-chibi unlock',          included:true},
        {text:'All styles & backgrounds',       included:true},
        {text:'Priority generation queue',      included:true},
        {text:'Download without watermark',     included:true},
        {text:'Commercial usage license',       included:false},
      ],
    },
    { id:'STUDIO', icon:'🚀', name:'Studio', monthly:24.99, annual:19.99,
      cta:'Go Studio 🚀', featured:false,
      features:[
        {text:'Unlimited generations',          included:true},
        {text:'4K quality export',              included:true},
        {text:'Commercial usage license',       included:true},
        {text:'API access',                     included:true},
        {text:'Custom style training',          included:true},
        {text:'Priority support',               included:true},
        {text:'Prompt marketplace access',      included:true},
      ],
    },
  ];

  async function handleCheckout(planId) {
    if (!user) { addToast('Sign in to upgrade your plan 🔐', 'warning'); return; }
    if (user.plan === planId) { addToast(`You're already on the ${planId} plan 🎉`, 'info'); return; }
    setUpgrading(planId);
    try {
      const r = await fetch('api/billing/checkout', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ plan: planId }),
      });
      const d = await r.json();
      if (d.url) { window.location.href = d.url; return; }
      // Simulate plan upgrade in demo mode
      await api.patch('users', user.id, { plan: planId, updatedAt: Date.now() });
      await refreshUser();
      addToast(`🎉 Plan upgraded to ${planId}! (Demo mode — connect Stripe for real payments)`, 'success');
    } catch {
      addToast('Connect Stripe to enable payments 💳', 'info');
    } finally { setUpgrading(null); }
  }

  return React.createElement('section',{className:'pricing-section',id:'pricing',ref:sectionRef},
    React.createElement('div',{className:'container'},
      React.createElement('div',{className:`section-header fade-in-up ${visible?'visible':''}`},
        React.createElement('div',{className:'section-badge'},'💎 PRICING'),
        React.createElement('h2',{className:'section-title'},'Choose Your Plan'),
        React.createElement('p',{className:'section-subtitle'},'Start free, upgrade when you need more magic.')
      ),

      // Toggle
      React.createElement('div',{className:'billing-toggle'},
        React.createElement('span',{className:'toggle-label'},'Monthly'),
        React.createElement('div',{className:`toggle-switch ${isAnnual?'on':''}`,onClick:()=>setIsAnnual(p=>!p)},React.createElement('div',{className:'toggle-thumb'})),
        React.createElement('span',{className:'toggle-label'},'Annual'),
        isAnnual && React.createElement('span',{className:'save-badge'},'Save 20%')
      ),

      // Cards
      React.createElement('div',{className:'pricing-grid'},
        plans.map((plan,i)=>React.createElement('div',{
          key:plan.id,
          className:`pricing-card ${plan.featured?'featured':''} fade-in-up ${visible?'visible':''}`,
          style:{transitionDelay:`${i*0.1}s`}
        },
          plan.featured && React.createElement('div',{className:'popular-badge'},'⭐ Most Popular'),
          React.createElement('div',{className:'pricing-header',style:{paddingTop:plan.featured?'52px':'40px'}},
            React.createElement('div',{className:'pricing-icon'},plan.icon),
            React.createElement('div',{className:'pricing-name'},plan.name),
            React.createElement('div',{className:'pricing-price'},
              plan.monthly>0 && React.createElement('span',{className:'price-currency'},'$'),
              React.createElement('span',{className:'price-amount'},plan.monthly===0?'0':(isAnnual?plan.annual:plan.monthly).toFixed(2).replace('.00','')),
              plan.monthly>0 && React.createElement('span',{className:'price-period'},`/${isAnnual?'mo, billed annually':'month'}`)
            ),
            plan.monthly===0 && React.createElement('span',{style:{fontSize:'14px',color:'var(--text-muted)'}},'Forever free')
          ),
          React.createElement('div',{className:'pricing-body'},
            React.createElement('div',{className:'pricing-features'},
              plan.features.map(f=>React.createElement('div',{key:f.text,className:'pricing-feature'},
                f.included ? React.createElement('div',{className:'feature-check'},'✓') : React.createElement('div',{className:'feature-x'},'×'),
                React.createElement('span',{style:{color:f.included?'var(--text-secondary)':'var(--text-muted)'}},f.text)
              ))
            ),
            React.createElement('button',{
              className:`btn btn-full ${plan.featured?'btn-gold btn-lg':'btn-outline'}`,
              onClick:()=>plan.id==='FREE'?addToast('Create your free account above 🌱','info'):handleCheckout(plan.id),
              disabled:upgrading===plan.id || user?.plan===plan.id,
            },
              upgrading===plan.id ? React.createElement(React.Fragment,null,React.createElement('span',{className:'spinner'}),'Processing...')
                : user?.plan===plan.id ? '✅ Current Plan'
                : plan.cta
            )
          )
        ))
      ),

      // FAQ
      React.createElement('div',{className:'faq-section'},
        React.createElement('h3',{className:'faq-title'},'💬 Frequently Asked Questions'),
        FAQ_ITEMS.map((faq,i)=>React.createElement('div',{key:i,className:`faq-item ${openFaq===i?'open':''}`},
          React.createElement('button',{className:'faq-question',onClick:()=>setOpenFaq(openFaq===i?null:i)},faq.q,React.createElement('span',{className:'faq-chevron'},'▼')),
          React.createElement('div',{className:'faq-answer'},faq.a)
        ))
      )
    )
  );
}

// =====================================================
// AUTH MODAL
// =====================================================

function AuthModal({ mode, onClose, onSwitch }) {
  const { login, register, authLoading } = useAuth();
  const { addToast } = useToast();
  const [form,    setForm]    = useState({ name:'', email:'', password:'', confirm:'', remember:false, terms:false });
  const [errors,  setErrors]  = useState({});
  const [success, setSuccess] = useState(false);
  const [showPw,  setShowPw]  = useState(false);

  function upd(field, val) {
    setForm(p=>({...p,[field]:val}));
    if (errors[field]) setErrors(p=>({...p,[field]:''}));
  }

  function validate() {
    const e = {};
    if (mode==='register' && !form.name.trim())                          e.name     = 'Name is required';
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/))               e.email    = 'Valid email required';
    if (form.password.length < 8)                                        e.password = 'Min. 8 characters';
    if (mode==='register' && form.password !== form.confirm)             e.confirm  = 'Passwords do not match';
    if (mode==='register' && !form.terms)                                e.terms    = 'Please accept the terms';
    return e;
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    const result = mode==='login' ? await login(form.email,form.password) : await register(form.name,form.email,form.password);
    if (result.success) {
      setSuccess(true);
      addToast(mode==='login'?`Welcome back, ${result.user.name}! ✨`:`Welcome, ${result.user.name}! 🎉`,'success');
      setTimeout(onClose,1500);
    } else {
      setErrors({submit:result.error});
    }
  }

  if (success) return React.createElement('div',{className:'modal-overlay',onClick:onClose},
    React.createElement('div',{className:'modal-card',onClick:e=>e.stopPropagation(),style:{textAlign:'center'}},
      React.createElement('div',{className:'success-check'},'✓'),
      React.createElement('div',{className:'modal-title'},mode==='login'?'Welcome back!':'Account created!'),
      React.createElement('div',{className:'modal-subtitle'},mode==='login'?"Let's create some chibis ✨":"Time to bring your characters to life! 🎨")
    )
  );

  return React.createElement('div',{className:'modal-overlay',onClick:onClose},
    React.createElement('div',{className:'modal-card',onClick:e=>e.stopPropagation()},
      React.createElement('button',{className:'modal-close',onClick:onClose},'×'),
      React.createElement('div',{className:'modal-header'},
        React.createElement('div',{className:'modal-icon'},mode==='login'?'👋':'✨'),
        React.createElement('h2',{className:'modal-title'},mode==='login'?'Welcome Back':'Create Account'),
        React.createElement('p',{className:'modal-subtitle'},mode==='login'?'Sign in to your Chibi Creator account':'Join 12,000+ chibi creators today')
      ),
      // Social buttons
      React.createElement('div',{className:'social-btns',style:{marginBottom:'20px'}},
        React.createElement('button',{className:'social-btn',onClick:()=>addToast('Google login coming soon! 🚀','info')},'🔍 Continue with Google'),
        React.createElement('button',{className:'social-btn',onClick:()=>addToast('Discord login coming soon! 🚀','info')},'💬 Continue with Discord')
      ),
      React.createElement('div',{className:'social-divider'},React.createElement('span',{className:'social-divider-text'},'or continue with email')),

      React.createElement('form',{className:'modal-form',onSubmit:handleSubmit},
        mode==='register' && React.createElement('div',{className:'form-row'},
          React.createElement('label',{className:'input-label'},'Full Name'),
          React.createElement('input',{className:`input ${errors.name?'input-error':''}`,type:'text',placeholder:'Sakura Yamamoto',value:form.name,onChange:e=>upd('name',e.target.value),autoComplete:'name'}),
          errors.name && React.createElement('span',{className:'error-text'},errors.name)
        ),
        React.createElement('div',{className:'form-row'},
          React.createElement('label',{className:'input-label'},'Email Address'),
          React.createElement('input',{className:`input ${errors.email?'input-error':''}`,type:'email',placeholder:'you@example.com',value:form.email,onChange:e=>upd('email',e.target.value),autoComplete:'email'}),
          errors.email && React.createElement('span',{className:'error-text'},errors.email)
        ),
        React.createElement('div',{className:'form-row'},
          React.createElement('label',{className:'input-label'},'Password'),
          React.createElement('div',{style:{position:'relative'}},
            React.createElement('input',{className:`input ${errors.password?'input-error':''}`,type:showPw?'text':'password',placeholder:mode==='register'?'Min. 8 characters':'••••••••',value:form.password,onChange:e=>upd('password',e.target.value),style:{paddingRight:'44px'}}),
            React.createElement('button',{type:'button',style:{position:'absolute',right:'12px',top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',fontSize:'18px',color:'var(--text-muted)'},onClick:()=>setShowPw(p=>!p)},showPw?'🙈':'👁️')
          ),
          errors.password && React.createElement('span',{className:'error-text'},errors.password)
        ),
        mode==='register' && React.createElement('div',{className:'form-row'},
          React.createElement('label',{className:'input-label'},'Confirm Password'),
          React.createElement('input',{className:`input ${errors.confirm?'input-error':''}`,type:'password',placeholder:'Repeat password',value:form.confirm,onChange:e=>upd('confirm',e.target.value)}),
          errors.confirm && React.createElement('span',{className:'error-text'},errors.confirm)
        ),
        mode==='login' && React.createElement('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center'}},
          React.createElement('label',{className:'checkbox-row'},React.createElement('input',{type:'checkbox',checked:form.remember,onChange:e=>upd('remember',e.target.checked)}),'Remember me'),
          React.createElement('span',{className:'modal-link',style:{fontSize:'13px'}},'Forgot password?')
        ),
        mode==='register' && React.createElement('div',{className:'form-row'},
          React.createElement('label',{className:'checkbox-row'},
            React.createElement('input',{type:'checkbox',checked:form.terms,onChange:e=>upd('terms',e.target.checked)}),
            React.createElement('span',null,'I agree to the ',React.createElement('span',{className:'modal-link'},'Terms of Service'),' and ',React.createElement('span',{className:'modal-link'},'Privacy Policy'))
          ),
          errors.terms && React.createElement('span',{className:'error-text'},errors.terms)
        ),
        errors.submit && React.createElement('div',{style:{background:'rgba(255,68,102,0.1)',border:'1px solid rgba(255,68,102,0.3)',borderRadius:'12px',padding:'12px',fontSize:'13px',color:'#FF4466',textAlign:'center'}},errors.submit),
        React.createElement('button',{type:'submit',className:'btn btn-gold btn-full btn-lg',disabled:authLoading},
          authLoading ? React.createElement(React.Fragment,null,React.createElement('span',{className:'spinner'}),'Please wait...')
            : mode==='login' ? '✨ Sign In' : '🎉 Create Free Account'
        )
      ),
      React.createElement('div',{className:'modal-footer'},
        mode==='login'
          ? React.createElement(React.Fragment,null,"Don't have an account? ",React.createElement('span',{className:'modal-link',onClick:onSwitch},'Sign up free'))
          : React.createElement(React.Fragment,null,'Already have an account? ',React.createElement('span',{className:'modal-link',onClick:onSwitch},'Sign in'))
      )
    )
  );
}

// =====================================================
// FOOTER
// =====================================================

function Footer() {
  const { addToast } = useToast();
  const [email, setEmail] = useState('');

  function handleSubscribe(e) {
    e.preventDefault();
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) { addToast('Please enter a valid email 📧','error'); return; }
    addToast("🎉 Subscribed! Watch for magical updates.",'success');
    setEmail('');
  }

  return React.createElement('footer',{className:'footer'},
    React.createElement('div',{className:'container'},
      React.createElement('div',{className:'footer-grid'},
        React.createElement('div',null,
          React.createElement('div',{className:'footer-brand-logo'},'✨ Chibi Creator'),
          React.createElement('p',{className:'footer-brand-desc'},'The most delightful AI chibi character generator on the internet. Transform anyone into an adorable anime character in seconds.'),
          React.createElement('form',{className:'footer-newsletter',onSubmit:handleSubscribe},
            React.createElement('input',{className:'footer-input',type:'email',placeholder:'Your email...',value:email,onChange:e=>setEmail(e.target.value)}),
            React.createElement('button',{type:'submit',className:'btn btn-primary btn-sm'},'✨')
          )
        ),
        ...[
          {title:'Product',   links:['Create Studio','Gallery','Pricing','API Docs','Prompt Marketplace']},
          {title:'Resources', links:['Getting Started','Style Guide','API Reference','Blog','Community']},
          {title:'Company',   links:['About Us','Careers','Privacy Policy','Terms of Service','Contact']},
        ].map(col=>React.createElement('div',{key:col.title},
          React.createElement('div',{className:'footer-col-title'},col.title),
          React.createElement('ul',{className:'footer-links'},
            col.links.map(link=>React.createElement('li',{key:link},React.createElement('a',{className:'footer-link',onClick:()=>addToast(`${link} — coming soon! 🚀`,'info')},link)))
          )
        ))
      ),
      React.createElement('div',{className:'footer-bottom'},
        React.createElement('div',{className:'footer-tagline'},'Made with 💖 and AI · © 2025 Chibi Creator, Inc. All rights reserved.'),
        React.createElement('div',{className:'footer-socials'},
          ['🐦','💬','📘','🎮','📸'].map((ic,i)=>React.createElement('div',{key:i,className:'social-icon',onClick:()=>addToast('Follow us on social media — coming soon! 🚀','info')},ic))
        )
      )
    )
  );
}

// =====================================================
// TABLE INIT
// =====================================================

async function initTables() {
  // Ensure quota_usage table exists by touching it
  try { await api.get('quota_usage', { limit:1 }); } catch {}
}

// =====================================================
// ROOT APP
// =====================================================

function App() {
  const [authModal,      setAuthModal]      = useState(null);
  const [settingsOpen,   setSettingsOpen]   = useState(false);
  const [activeSection,  setActiveSection]  = useState('hero');

  useEffect(() => {
    initTables();
    // Inject bounce keyframe
    const s = document.createElement('style');
    s.textContent = '@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}} @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}';
    document.head.appendChild(s);
    // Section tracker
    const ids = ['hero','studio','gallery','ux','architecture','pricing'];
    const obs = ids.map(id => {
      const el = document.getElementById(id);
      if (!el) return null;
      const o = new IntersectionObserver(([e])=>{ if(e.isIntersecting) setActiveSection(id); },{threshold:0.3});
      o.observe(el);
      return o;
    });
    return () => obs.forEach(o=>o?.disconnect());
  }, []);

  return React.createElement(ToastProvider, null,
    React.createElement(AuthProvider, null,
      React.createElement('div', { className:'app' },
        React.createElement(Navbar, { onLoginClick:()=>setAuthModal('login'), onRegisterClick:()=>setAuthModal('register'), activeSection, onOpenSettings:()=>setSettingsOpen(true) }),
        React.createElement(HeroSection,    { onStartCreating:()=>document.getElementById('studio')?.scrollIntoView({behavior:'smooth'}) }),
        React.createElement(CreationStudio, { onOpenAuth:(mode)=>setAuthModal(mode||'login'), onOpenSettings:()=>setSettingsOpen(true) }),
        React.createElement(GallerySection),
        React.createElement(UXSection),
        React.createElement(ArchSection),
        React.createElement(PricingSection),
        React.createElement(Footer),
        authModal     && React.createElement(AuthModal,    { mode:authModal, onClose:()=>setAuthModal(null), onSwitch:()=>setAuthModal(m=>m==='login'?'register':'login') }),
        settingsOpen  && React.createElement(SettingsModal, { onClose:()=>{ setSettingsOpen(false); window.dispatchEvent(new Event('chibi-settings-saved')); } })
      )
    )
  );
}

// Mount
ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App));
