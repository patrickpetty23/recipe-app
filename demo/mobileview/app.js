/* ──────────────────────────────────────────────
   Recipe Scanner — Mobile Demo App Logic
   Complete rebuild: OCR + parser + state + UI
   ────────────────────────────────────────────── */

"use strict";

// ─── Constants ───
const STORAGE_KEY = "recipe-scanner-demo.v5";
const OCR_PROXY_ENDPOINT = "http://127.0.0.1:8765/ocr";
const OCR_PROXY_TIMEOUT_MS = 120_000;
const MAX_LOGS = 240;

const NAV_META = {
  "scan-view":     { title: "Scanner",       action: null },
  "recipes-view":  { title: "Recipes",       action: "merge" },
  "shopping-view": { title: "Shopping List",  action: "clear" },
  "settings-view": { title: "Settings",      action: null },
};

const COMMON_UNITS = new Set([
  "c","cup","cups","tbsp","tablespoon","tablespoons","tsp","teaspoon","teaspoons",
  "oz","ounce","ounces","lb","lbs","pound","pounds","g","gram","grams","kg","ml","l",
  "clove","cloves","can","cans","pkg","package","packages","pinch","dash",
]);

const BLOCKED_PREFIXES = new Set([
  "instructions","direction","directions","steps","method","serves","yield",
  "nutrition","notes","tip","tips","ingredients",
]);

const SECTION_END_PREFIXES = new Set([
  "instructions","direction","directions","steps","method",
  "nutrition","notes","tip","tips","serves","yield",
]);

const INSTRUCTION_HINT_WORDS = new Set([
  "preheat","mix","stir","cook","bake","combine","whisk",
  "simmer","boil","serve","heat","pour","add",
]);

const STOP_WORDS = new Set([
  "for","with","and","the","a","an","to","of","fresh","optional","or","plus",
  "room","temperature","chopped","diced","minced","sliced","large","small","medium",
]);

const INGREDIENT_HINT_WORDS = new Set([
  "flour","sugar","salt","pepper","oil","olive","garlic","onion","milk","butter",
  "egg","eggs","water","rice","pasta","tomato","chicken","beef","pork","cheese",
  "lemon","lime","vinegar","basil","parsley","oregano","paprika","cumin","coriander",
  "potato","carrot","celery","broth","stock","cream","yogurt","honey","vanilla",
  "baking","powder","soda","yeast","cornstarch","beans","lentils","cilantro","shrimp",
  "salmon","tuna","avocado","spinach","mushroom","zucchini","cabbage","ginger","chili","chile",
]);

const FRACTION_MAP = {
  "\u00bc":"1/4", "\u00bd":"1/2", "\u00be":"3/4",
  "\u2153":"1/3", "\u2154":"2/3",
  "\u215b":"1/8", "\u215c":"3/8", "\u215d":"5/8", "\u215e":"7/8",
};

const SAMPLE_RECIPE_TEXT = `Mexican Grilled Chicken Bowl
1 lb chicken breast
2 cups cooked rice
1 can black beans, drained
1 cup corn kernels
1 avocado, sliced
1/2 cup salsa
1/4 cup sour cream
1 cup shredded lettuce
1/2 cup shredded cheese
2 tbsp olive oil
1 tsp cumin
1 tsp paprika
1/2 tsp garlic powder
Salt and pepper to taste
2 tbsp fresh cilantro, chopped
1 lime, juiced`;

const MEAL_API_ENDPOINT = "http://127.0.0.1:8765/analyze-meal";

const SAMPLE_MEAL_ANALYSIS = {
  name: "Mexican Grilled Chicken Bowl",
  description: "A vibrant bowl featuring seasoned grilled chicken, fluffy rice, black beans, fresh vegetables, and creamy toppings.",
  cuisine: "Mexican",
  servings: 4,
  prepTime: "15 minutes",
  cookTime: "20 minutes",
  ingredients: [
    { name: "chicken breast", quantity: "1", unit: "lb" },
    { name: "cooked white rice", quantity: "2", unit: "cups" },
    { name: "black beans, drained and rinsed", quantity: "1", unit: "can (15 oz)" },
    { name: "corn kernels", quantity: "1", unit: "cup" },
    { name: "avocado, sliced", quantity: "1", unit: "" },
    { name: "salsa", quantity: "1/2", unit: "cup" },
    { name: "sour cream", quantity: "1/4", unit: "cup" },
    { name: "shredded lettuce", quantity: "1", unit: "cup" },
    { name: "shredded Mexican cheese blend", quantity: "1/2", unit: "cup" },
    { name: "olive oil", quantity: "2", unit: "tbsp" },
    { name: "ground cumin", quantity: "1", unit: "tsp" },
    { name: "smoked paprika", quantity: "1", unit: "tsp" },
    { name: "garlic powder", quantity: "1/2", unit: "tsp" },
    { name: "salt", quantity: "1", unit: "tsp" },
    { name: "black pepper", quantity: "1/2", unit: "tsp" },
    { name: "fresh cilantro, chopped", quantity: "2", unit: "tbsp" },
    { name: "lime", quantity: "1", unit: "" },
  ],
  steps: [
    { step: 1, instruction: "In a small bowl, combine cumin, smoked paprika, garlic powder, salt, and black pepper to make the spice rub.", temperature: null, duration: null },
    { step: 2, instruction: "Pat chicken breasts dry with paper towels. Drizzle with 1 tbsp olive oil, then coat evenly with the spice rub.", temperature: null, duration: "2 minutes" },
    { step: 3, instruction: "Preheat a grill pan or outdoor grill to medium-high heat (400°F / 200°C).", temperature: "400°F (200°C)", duration: null },
    { step: 4, instruction: "Grill chicken breasts for 6-7 minutes per side until internal temperature reaches 165°F (74°C). Let rest 5 minutes before slicing.", temperature: "165°F (74°C)", duration: "14 minutes" },
    { step: 5, instruction: "While chicken rests, heat remaining 1 tbsp olive oil in a skillet over medium heat. Add corn kernels and cook until slightly charred.", temperature: null, duration: "4 minutes" },
    { step: 6, instruction: "Warm black beans in a small saucepan over medium-low heat. Season with a pinch of cumin and salt.", temperature: null, duration: "3 minutes" },
    { step: 7, instruction: "Slice the grilled chicken into 1/2-inch strips.", temperature: null, duration: null },
    { step: 8, instruction: "Divide cooked rice evenly among 4 bowls as the base.", temperature: null, duration: null },
    { step: 9, instruction: "Arrange sliced chicken, black beans, charred corn, shredded lettuce, and avocado slices on top of the rice.", temperature: null, duration: null },
    { step: 10, instruction: "Top each bowl with salsa, a dollop of sour cream, shredded cheese, and fresh cilantro.", temperature: null, duration: null },
    { step: 11, instruction: "Squeeze fresh lime juice over each bowl and serve immediately.", temperature: null, duration: null },
  ],
};

// ─── Utility ───
function uid() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function trimToNull(v) {
  const s = String(v ?? "").trim();
  return s || null;
}

function escapeHtml(v) {
  return String(v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch { return String(iso); }
}

function clamp(v, lo = 0, hi = 1) { return Math.max(lo, Math.min(hi, v)); }

function logEvent(level, event, metadata = {}) {
  const safeMetadata = {};
  for (const [key, value] of Object.entries(metadata || {})) {
    safeMetadata[key] = String(value);
  }

  state.logs.push({
    timestamp: new Date().toISOString(),
    level: String(level || "info"),
    event: String(event || "event"),
    metadata: safeMetadata,
  });

  if (state.logs.length > MAX_LOGS) {
    state.logs = state.logs.slice(state.logs.length - MAX_LOGS);
  }
}

// ─── State ───
function makeDefaultState() {
  return {
    recipes: [],
    activeShoppingList: null,
    logs: [],
    selectedImageDataUrl: null,
    draftRecipeName: "",
    draftIngredients: [],
    rawOCRText: "",
    ocrConfidence: 0,
    ocrSource: null,
    droppedOCRLines: [],
    isProcessing: false,
    scanErrorMessage: null,
    lowConfidenceWarning: null,
    showEditor: false,
    settings: { useCloudFallback: true, lowConfidenceThreshold: 0.7 },
    ui: { activeView: "scan-view" },
    detail: { recipeId: null },
    pendingConfirm: null,
    usedSample: false,
    scanMode: "recipe",
    selectedImages: [],
    mealImageDataUrl: null,
    mealAnalysis: null,
    draftSteps: [],
  };
}

function loadState() {
  const fallback = makeDefaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return {
      ...fallback,
      recipes: Array.isArray(parsed.recipes) ? parsed.recipes : [],
      activeShoppingList: parsed.activeShoppingList || null,
      logs: Array.isArray(parsed.logs) ? parsed.logs : [],
      settings: { ...fallback.settings, ...(parsed.settings || {}) },
      ui: { activeView: NAV_META[parsed?.ui?.activeView] ? parsed.ui.activeView : "scan-view" },
    };
  } catch { return fallback; }
}

let state = loadState();

function saveState() {
  const payload = {
    recipes: state.recipes,
    activeShoppingList: state.activeShoppingList,
    logs: state.logs,
    settings: state.settings,
    ui: { activeView: state.ui.activeView },
  };
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(payload)); } catch { /* quota */ }
}

// ─── DOM References ───
const $ = (id) => document.getElementById(id);
const dom = {
  statusTime:        $("status-time"),
  navTitle:          $("nav-title"),
  navAction:         $("nav-action"),
  tabs:              Array.from(document.querySelectorAll(".tab")),
  views:             Array.from(document.querySelectorAll(".view")),
  openCameraBtn:     $("open-camera-btn"),
  importPhotoBtn:    $("import-photo-btn"),
  cameraInput:       $("camera-input"),
  photoInput:        $("photo-input"),
  imagePreview:      $("image-preview"),
  imagePlaceholder:  $("image-placeholder"),
  trySampleBtn:      $("try-sample-btn"),
  extractBtn:        $("extract-btn"),
  extractProgress:   $("extract-progress"),
  warningMsg:        $("warning-msg"),
  errorMsg:          $("error-msg"),
  confidenceBox:     $("confidence-box"),
  ocrConfValue:      $("ocr-confidence-value"),
  ocrConfBar:        $("ocr-confidence-bar"),
  ocrSourceLabel:    $("ocr-source-label"),
  recipesEmpty:      $("recipes-empty"),
  recipesList:       $("recipes-list"),
  shoppingEmpty:     $("shopping-empty"),
  shoppingSummary:   $("shopping-summary"),
  shoppingList:      $("shopping-list"),
  cloudToggle:       $("cloud-toggle"),
  thresholdSlider:   $("threshold-slider"),
  thresholdValue:    $("threshold-value"),
  resetAllBtn:       $("reset-all-btn"),
  copyLogsBtn:       $("copy-logs-btn"),
  logsPreview:       $("logs-preview"),
  editorSheet:       $("editor-sheet"),
  editorClose:       $("editor-close"),
  editorSave:        $("editor-save"),
  recipeNameInput:   $("recipe-name-input"),
  ingredientCountBadge: $("ingredient-count-badge"),
  ingredientList:    $("ingredient-list"),
  addIngredientBtn:  $("add-ingredient-btn"),
  droppedLinesBox:   $("dropped-lines-box"),
  droppedLinesList:  $("dropped-lines-list"),
  detailSheet:       $("recipe-detail-sheet"),
  detailClose:       $("detail-close"),
  detailTitle:       $("detail-title"),
  detailGenerate:    $("detail-generate"),
  detailImagePreview:$("detail-image-preview"),
  detailIngredients: $("detail-ingredients"),
  confirmDialog:     $("confirm-dialog"),
  confirmTitle:      $("confirm-title"),
  confirmMessage:    $("confirm-message"),
  confirmCancel:     $("confirm-cancel"),
  confirmOk:         $("confirm-ok"),
  // Mode toggle & meal identification
  modeRecipeBtn:     $("mode-recipe-btn"),
  modeMealBtn:       $("mode-meal-btn"),
  recipeMode:        $("recipe-mode"),
  mealMode:          $("meal-mode"),
  photoGrid:         $("photo-grid"),
  mealCameraBtn:     $("meal-camera-btn"),
  mealImportBtn:     $("meal-import-btn"),
  mealCameraInput:   $("meal-camera-input"),
  mealPhotoInput:    $("meal-photo-input"),
  mealImagePreview:  $("meal-image-preview"),
  analyzeMealBtn:    $("analyze-meal-btn"),
  mealProgress:      $("meal-progress"),
  mealErrorMsg:      $("meal-error-msg"),
  // Steps (editor & detail)
  stepsSection:      $("steps-section"),
  stepsCountBadge:   $("steps-count-badge"),
  stepsList:         $("steps-list"),
  detailMeta:        $("detail-meta"),
  detailStepsSection:$("detail-steps-section"),
  detailSteps:       $("detail-steps"),
};

function setHidden(el, hidden) { el.classList.toggle("hidden", hidden); }

// ─── Clock ───
function updateClock() {
  const now = new Date();
  dom.statusTime.textContent = now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}
setInterval(updateClock, 30_000);
updateClock();

// ──────────────────────────────────────────────
// INGREDIENT PARSER (port from RecipeCore)
// ──────────────────────────────────────────────

function tokenizeAlpha(text) {
  return (String(text).toLowerCase().match(/[a-z]+/g) || []).filter(Boolean);
}

function symbolRatio(text) {
  if (!text.length) return 1;
  return (text.match(/[^a-zA-Z0-9\s./,()\-]/g) || []).length / text.length;
}

function hasGibberishToken(text) {
  return String(text).split(/\s+/).some((tok) => {
    const c = tok.replace(/[^a-z]/gi, "").toLowerCase();
    if (c.length < 7) return false;
    const v = (c.match(/[aeiou]/g) || []).length;
    return v === 0 || v / c.length < 0.16;
  });
}

function countLetters(text) { return (String(text).match(/[A-Za-z]/g) || []).length; }

function splitFusedMeasurementTokens(line) {
  const u = "(tablespoons?|tbsp|teaspoons?|tsp|ounces?|oz|pounds?|lbs?|lb|grams?|gram|g|kg|ml|l|cloves?|clove|cans?|can|packages?|package|pkg|pinch|dash|cups?|cup)";
  return line
    .replace(new RegExp(`(\\d[\\d./-]*)(?:\\s*)(${u})(?=[a-z])`, "gi"), "$1 $2 ")
    .replace(new RegExp(`\\b(${u})([a-z]{3,})\\b`, "gi"), "$1 $2")
    .replace(/(\d)([a-zA-Z])/g, "$1 $2")
    .replace(/([a-zA-Z])(\d)/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeText(text) {
  let v = String(text || "").trim();
  v = v
    .replace(/(\d)([\u00bc\u00bd\u00be\u2153\u2154\u215b\u215c\u215d\u215e])/g, "$1 $2")
    .replace(/([\u00bc\u00bd\u00be\u2153\u2154\u215b\u215c\u215d\u215e])(\d)/g, "$1 $2");
  Object.entries(FRACTION_MAP).forEach(([from, to]) => { v = v.replaceAll(from, to); });
  v = v
    .replaceAll("\u2022", " ").replaceAll("\u2014", " ")
    .replaceAll("\u2018", "'").replaceAll("\u2019", "'")
    .replaceAll("\u201c", '"').replaceAll("\u201d", '"')
    .replaceAll("\t", " ").replace(/\s+/g, " ").trim();
  v = v
    .replace(/\b[I|l](?=\/\d)/g, "1")
    .replace(/\bO(?=\d)/g, "0")
    .replace(/(\d)\s*-\s*(\d+\/\d+)/g, "$1-$2")
    .replace(/^\W+/, "").trim();
  return splitFusedMeasurementTokens(v);
}

function normalizeUnitToken(tok) {
  return String(tok || "").toLowerCase().replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, "");
}

function normalizeQuantityToken(tok) {
  let n = String(tok || "").toLowerCase().replace(/^[^a-z0-9./-]+|[^a-z0-9./-]+$/g, "");
  return n.replace(/[|il](?=\/\d)/g, "1").replace(/^o(?=\d)/g, "0").replace(/(\d)-(\d+\/\d+)/g, "$1-$2");
}

function normalizeUnitValue(tok) {
  const n = normalizeUnitToken(tok);
  if (!n) return null;
  const map = { tablespoon:"tbsp",tablespoons:"tbsp",teaspoon:"tsp",teaspoons:"tsp",
    ounce:"oz",ounces:"oz",pound:"lb",pounds:"lb",lbs:"lb",grams:"g",cloves:"clove",
    cans:"can",packages:"package",cups:"cup" };
  return map[n] || n;
}

function isQuantityToken(tok) {
  const n = normalizeQuantityToken(tok);
  if (!n) return false;
  return /^\d+$|^\d+\.\d+$|^\d+\/\d+$|^\d+-\d+$|^\d+-\d+\/\d+$/.test(n);
}

function startsIngredientSection(line) {
  return /^\s*ingredients?\s*[:\-]?\s*$/i.test(line) || /^\s*ingredients?\s*:/i.test(line);
}

function endsIngredientSection(line) {
  const first = String(line || "").toLowerCase().trim().split(/\s+/)[0] || "";
  return SECTION_END_PREFIXES.has(first);
}

function hasUnitTokenAnywhere(tokens) {
  return tokens.some((t) => COMMON_UNITS.has(normalizeUnitToken(t)));
}

function hasInstructionVerb(line) {
  for (const w of INSTRUCTION_HINT_WORDS) { if (line.includes(w)) return true; }
  return false;
}

function analyzeIngredientName(name) {
  const trimmed = String(name || "").trim();
  const words = tokenizeAlpha(trimmed).filter((w) => !STOP_WORDS.has(w));
  const hintHits = words.filter((w) => INGREDIENT_HINT_WORDS.has(w)).length;
  const longWordCount = words.filter((w) => w.length >= 3).length;
  const singleCharWords = words.filter((w) => w.length === 1).length;
  const letters = countLetters(trimmed);
  const nonSpaceLength = trimmed.replace(/\s+/g, "").length || 1;
  const alphaRatio = letters / nonSpaceLength;
  const digits = (trimmed.match(/\d/g) || []).length;
  const digitRatio = digits / nonSpaceLength;
  const longWordRatio = words.length ? longWordCount / words.length : 0;
  return { trimmed, words, hintHits, longWordCount, singleCharWords, letters, digits,
    nonSpaceLength, alphaRatio, digitRatio, symbol: symbolRatio(trimmed), longWordRatio };
}

function isReadableIngredientName(name) {
  const s = analyzeIngredientName(name);
  if (!s.trimmed || s.letters < 3 || s.alphaRatio < 0.58) return false;
  if (s.digitRatio > 0.16 || s.digits > 1 || s.symbol > 0.12) return false;
  if (s.words.length < 1 || s.words.length > 6 || s.longWordCount < 1) return false;
  if (s.hintHits === 0 && s.longWordRatio < 0.4) return false;
  if (s.singleCharWords > 0 && s.words.length > 1 && s.hintHits === 0) return false;
  if (hasGibberishToken(s.trimmed)) return false;
  return true;
}

function ingredientNameQuality(name) {
  if (!isReadableIngredientName(name)) return 0;
  const s = analyzeIngredientName(name);
  let score = 0.45;
  if (s.hintHits > 0) score += 0.2;
  if (s.longWordRatio >= 0.7) score += 0.12;
  else if (s.longWordRatio >= 0.5) score += 0.08;
  if (s.digitRatio <= 0.05) score += 0.08;
  if (s.words.length <= 3) score += 0.05;
  if (s.symbol <= 0.05) score += 0.05;
  if (s.singleCharWords === 0) score += 0.05;
  return clamp(score);
}

function looksLikeIngredientName(name) {
  if (!isReadableIngredientName(name)) return false;
  const s = analyzeIngredientName(name);
  if (s.hintHits >= 1) return true;
  if (s.words.length === 1) return s.words[0].length >= 4;
  if (s.words.length <= 4 && s.words.every((w) => w.length >= 2 && w.length <= 14)) return true;
  if (s.longWordRatio >= 0.6) return true;
  return false;
}

function isLikelyIngredientLine(line) {
  const lower = line.toLowerCase();
  const first = lower.split(" ")[0];
  if (BLOCKED_PREFIXES.has(first)) return false;
  if (lower.includes("http://") || lower.includes("https://")) return false;
  if (countLetters(line) < 2 || symbolRatio(line) > 0.17 || hasGibberishToken(line)) return false;
  const tokens = line.split(/\s+/).filter(Boolean);
  const hasQty = tokens.length > 0 && isQuantityToken(tokens[0]);
  const hasUnit = hasUnitTokenAnywhere(tokens);
  const nameCandidate = tokens.slice(hasQty ? 1 : 0).filter((t) => !COMMON_UNITS.has(normalizeUnitToken(t))).join(" ").trim();
  if ((hasQty || hasUnit) && nameCandidate && !isReadableIngredientName(nameCandidate)) return false;
  if (!hasQty && !hasUnit) {
    const words = tokenizeAlpha(line).filter((w) => !STOP_WORDS.has(w));
    if (words.length < 1 || words.length > 6) return false;
    if (!looksLikeIngredientName(line)) return false;
  }
  return true;
}

function parseIngredientLine(line, confidence) {
  const norm = splitFusedMeasurementTokens(line);
  const tokens = norm.split(/\s+/).filter(Boolean);
  if (!tokens.length) return null;

  const qtyParts = [];
  while (tokens.length && isQuantityToken(tokens[0]) && qtyParts.length < 2) {
    qtyParts.push(normalizeQuantityToken(tokens.shift()));
  }

  let unit = null;
  if (tokens.length) {
    const nu = normalizeUnitValue(tokens[0]);
    if (nu && COMMON_UNITS.has(nu)) { unit = nu; tokens.shift(); }
  }

  if (!qtyParts.length && tokens.length >= 2) {
    const mq = normalizeQuantityToken(tokens[0]);
    const mu = normalizeUnitValue(tokens[1]);
    if (isQuantityToken(mq) && mu && COMMON_UNITS.has(mu)) {
      qtyParts.push(mq); unit = mu; tokens.shift(); tokens.shift();
    }
  }

  let name = tokens.join(" ").trim().replace(/^[,.:;\-]+|[,.:;\-]+$/g, "").trim();
  if (!name || !isReadableIngredientName(name)) return null;

  const hasQtyOrUnit = qtyParts.length > 0 || !!unit;
  const nq = ingredientNameQuality(name);
  const looks = looksLikeIngredientName(name);
  if (!looks && !hasQtyOrUnit) return null;
  if (!looks && nq < 0.62) return null;

  let score = Number.isFinite(confidence) ? confidence : 0.6;
  if (qtyParts.length) score += 0.08;
  if (unit) score += 0.08;
  score += nq * 0.2;
  if (looks) score += 0.04;
  if (name.length < 3) score -= 0.15;

  return { id: uid(), name, quantity: qtyParts.length ? qtyParts.join(" ") : null,
    unit, confidence: clamp(score), rawLine: norm };
}

function parseIngredientsFromLines(lines) {
  const normalized = lines
    .map((l) => ({ text: normalizeText(l.text), confidence: Number.isFinite(l.confidence) ? l.confidence : 0.6 }))
    .filter((l) => l.text);

  let scopedLines = normalized;
  const startIdx = normalized.findIndex((l) => startsIngredientSection(l.text));
  if (startIdx >= 0) {
    const section = normalized.slice(startIdx + 1);
    scopedLines = [];
    for (const entry of section) {
      const low = entry.text.toLowerCase();
      if (endsIngredientSection(entry.text) || (/^\s*\d+\s*[\).]/.test(low) && hasInstructionVerb(low))) break;
      scopedLines.push(entry);
    }
  }

  const ingredients = [], droppedLines = [];
  for (const lineObj of scopedLines) {
    if (!lineObj.text) continue;
    if (lineObj.confidence < 0.28) { droppedLines.push(lineObj.text); continue; }
    if (!isLikelyIngredientLine(lineObj.text)) { droppedLines.push(lineObj.text); continue; }
    const parsed = parseIngredientLine(lineObj.text, lineObj.confidence);
    if (!parsed) { droppedLines.push(lineObj.text); continue; }
    const hasQU = !!trimToNull(parsed.quantity) || !!trimToNull(parsed.unit);
    const nq = ingredientNameQuality(parsed.name);
    if (nq < (hasQU ? 0.52 : 0.62)) { droppedLines.push(lineObj.text); continue; }
    if (lineObj.confidence < 0.42 && !hasQU) { droppedLines.push(lineObj.text); continue; }
    parsed.confidence = clamp(parsed.confidence * 0.75 + nq * 0.25);
    ingredients.push(parsed);
  }

  // Dedup
  const seen = new Set(), deduped = [];
  for (const ing of ingredients) {
    const key = `${ing.name.toLowerCase()}|${(ing.quantity || "-").toLowerCase()}|${(ing.unit || "-").toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key); deduped.push(ing);
  }

  const total = scopedLines.length || normalized.length;
  const ic = deduped.length;
  const qc = deduped.filter((i) => !!trimToNull(i.quantity)).length;
  const uc = deduped.filter((i) => !!trimToNull(i.unit)).length;
  const anq = ic ? deduped.reduce((s, i) => s + ingredientNameQuality(i.name), 0) / ic : 0;
  const ac = ic ? deduped.reduce((s, i) => s + (i.confidence || 0), 0) / ic : 0;
  const py = total ? ic / total : 0;
  const qcov = ic ? qc / ic : 0;
  const ucov = ic ? uc / ic : 0;
  const qs = clamp(ac * 0.35 + py * 0.2 + qcov * 0.15 + ucov * 0.1 + anq * 0.2);

  return {
    ingredients: deduped, droppedLines,
    metrics: { totalLines: total, ingredientCount: ic, droppedCount: droppedLines.length,
      quantityCoverage: qcov, unitCoverage: ucov, avgNameQuality: anq, avgConfidence: ac, qualityScore: qs },
  };
}

// ──────────────────────────────────────────────
// OCR ENGINE (Tesseract.js + Cloud Proxy)
// ──────────────────────────────────────────────

async function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("Failed to read file."));
    reader.readAsDataURL(file);
  });
}

async function preprocessImageDataUrl(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const bw = img.naturalWidth || img.width;
      const bh = img.naturalHeight || img.height;
      const scale = Math.min(2.1, 2200 / Math.max(bw, bh));
      const w = Math.max(1, Math.round(bw * scale));
      const h = Math.max(1, Math.round(bh * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) { reject(new Error("Canvas init failed.")); return; }
      ctx.drawImage(img, 0, 0, w, h);
      const frame = ctx.getImageData(0, 0, w, h);
      const px = frame.data;
      for (let i = 0; i < px.length; i += 4) {
        let gray = px[i] * 0.299 + px[i+1] * 0.587 + px[i+2] * 0.114;
        gray = (gray - 128) * 1.42 + 128;
        gray = Math.max(0, Math.min(255, gray));
        const s = gray > 150 ? 255 : gray < 85 ? 0 : gray;
        px[i] = s; px[i+1] = s; px[i+2] = s;
      }
      ctx.putImageData(frame, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => reject(new Error("Failed to load image for preprocessing."));
    img.src = dataUrl;
  });
}

function linesFromTesseractData(data) {
  if (Array.isArray(data?.lines) && data.lines.length) {
    return data.lines.map((l) => ({
      text: String(l?.text || "").trim(),
      confidence: Number.isFinite(l?.confidence) ? clamp(l.confidence / 100) :
        Number.isFinite(data?.confidence) ? clamp(data.confidence / 100) : 0.6,
    })).filter((l) => l.text);
  }
  const fc = Number.isFinite(data?.confidence) ? clamp(data.confidence / 100) : 0.6;
  return String(data?.text || "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
    .map((l) => ({ text: l, confidence: fc }));
}

function linesFromCloudPayload(payload) {
  if (Array.isArray(payload?.lines) && payload.lines.length) {
    return payload.lines.map((l) => ({
      text: String(l?.text || "").trim(),
      confidence: Number.isFinite(l?.confidence) ? clamp(l.confidence) :
        Number.isFinite(payload?.averageConfidence) ? clamp(payload.averageConfidence) : 0.9,
    })).filter((l) => l.text);
  }
  const fc = Number.isFinite(payload?.averageConfidence) ? clamp(payload.averageConfidence) : 0.9;
  return String(payload?.rawText || "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
    .map((l) => ({ text: l, confidence: fc }));
}

async function runCloudProxyPass(imageDataUrl, sourceLabel) {
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), OCR_PROXY_TIMEOUT_MS);
  try {
    const resp = await fetch(OCR_PROXY_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageDataUrl }),
      signal: controller.signal,
    });
    if (!resp.ok) {
      let msg = "";
      try { const p = await resp.json(); msg = p?.error || p?.message || ""; } catch { msg = await resp.text(); }
      throw new Error(`Cloud OCR HTTP ${resp.status}${msg ? ` (${msg})` : ""}`);
    }
    const payload = await resp.json();
    if (!payload?.ok) throw new Error(payload?.error || "Cloud OCR unsuccessful.");
    const lines = linesFromCloudPayload(payload);
    const rawText = String(payload?.rawText || lines.map((l) => l.text).join("\n")).trim();
    const avgConf = lines.length ? lines.reduce((s, l) => s + l.confidence, 0) / lines.length :
      Number.isFinite(payload?.averageConfidence) ? clamp(payload.averageConfidence) : 0.88;
    const structuredIngredients = Array.isArray(payload?.ingredients)
      ? payload.ingredients.map((i) => ({
          id: uid(), name: String(i?.name || "").trim(), quantity: trimToNull(i?.quantity),
          unit: trimToNull(i?.unit), confidence: Number.isFinite(i?.confidence) ? clamp(i.confidence) : avgConf,
          rawLine: i?.rawLine ? String(i.rawLine) : null,
        })).filter((i) => i.name)
      : [];
    return {
      lines, rawText, averageConfidence: avgConf, source: payload?.source || sourceLabel || "cloud OCR",
      ingredients: structuredIngredients,
      droppedLines: Array.isArray(payload?.droppedLines) ? payload.droppedLines.map(String) : [],
      parseMeta: payload?.parseMeta || null, cloudMeta: payload?.meta || null,
    };
  } finally { clearTimeout(tid); }
}

function extractionScore(extraction) {
  const parsed = parseIngredientsFromLines(extraction.lines);
  const m = parsed.metrics;
  const lowIng = m.ingredientCount < 2 ? 4 : 0;
  const lowNQ = m.avgNameQuality < 0.55 ? 6 : 0;
  const lowQ = m.qualityScore < 0.45 ? 4 : 0;
  const score = m.ingredientCount * 2 + m.qualityScore * 12 + m.quantityCoverage * 4 +
    m.unitCoverage * 2 + m.avgNameQuality * 6 + extraction.averageConfidence * 4 -
    m.droppedCount * 0.6 - lowIng - lowNQ - lowQ;
  return { ...extraction, parseResult: parsed, score };
}

async function runTesseractPass(imageSource, sourceLabel, psm) {
  const result = await window.Tesseract.recognize(imageSource, "eng", {
    logger: (msg) => {
      if (!msg || msg.status !== "recognizing text") return;
      const pct = Math.round((msg.progress || 0) * 100);
      state.ui.extractProgress = `${sourceLabel}: ${pct}%`;
      renderScanStatus();
    },
    tessedit_pageseg_mode: String(psm),
    preserve_interword_spaces: "1",
    tessedit_char_whitelist: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/.,:-() %'",
  });
  const lines = linesFromTesseractData(result?.data);
  const rawText = lines.map((l) => l.text).join("\n");
  const avgConf = lines.length ? lines.reduce((s, l) => s + l.confidence, 0) / lines.length :
    Number.isFinite(result?.data?.confidence) ? clamp(result.data.confidence / 100) : 0;
  return { lines, rawText, averageConfidence: avgConf, source: sourceLabel };
}

async function runOCRExtraction(imageDataUrl) {
  const candidates = [];
  let cloudWarning = null;
  const preprocessed = await preprocessImageDataUrl(imageDataUrl);

  // Cloud first if enabled
  if (state.settings.useCloudFallback) {
    state.ui.extractProgress = "Cloud OCR: sending image…";
    renderScanStatus();
    try {
      const pass1 = await runCloudProxyPass(imageDataUrl, "cloud OCR (OCR.Space)");
      if (pass1.lines.length) candidates.push(pass1);
    } catch (e) { cloudWarning = e.message || String(e); }

    state.ui.extractProgress = "Cloud OCR: enhanced pass…";
    renderScanStatus();
    try {
      const pass2 = await runCloudProxyPass(preprocessed, "cloud OCR (OCR.Space preprocessed)");
      if (pass2.lines.length) candidates.push(pass2);
    } catch (e) { if (!cloudWarning) cloudWarning = e.message || String(e); }

    if (candidates.length) {
      const ranked = candidates.map(extractionScore).sort((a, b) => b.score - a.score);
      const best = ranked[0];
      const bm = best?.parseResult?.metrics || {};
      if ((bm.qualityScore || 0) >= 0.62 && (bm.ingredientCount || 0) >= 2) {
        if (cloudWarning) best.fallbackNote = `Cloud OCR partially degraded: ${cloudWarning}`;
        return best;
      }
    }
  }

  // Tesseract.js fallback
  if (!window.Tesseract || typeof window.Tesseract.recognize !== "function") {
    if (candidates.length) {
      const ranked = candidates.map(extractionScore).sort((a, b) => b.score - a.score);
      const best = ranked[0];
      if (cloudWarning) best.fallbackNote = `On-device OCR unavailable. ${cloudWarning}`;
      return best;
    }
    throw new Error("OCR engine not loaded. Start the cloud proxy (python scripts/ocr_proxy_server.py) or wait for Tesseract.js to load.");
  }

  const rawPass = await runTesseractPass(imageDataUrl, "on-device OCR (psm6)", 6);
  if (rawPass.lines.length) candidates.push(rawPass);

  const prepPass = await runTesseractPass(preprocessed, "on-device OCR processed (psm6)", 6);
  if (prepPass.lines.length) candidates.push(prepPass);

  const densePass = await runTesseractPass(preprocessed, "on-device OCR processed (psm4)", 4);
  if (densePass.lines.length) candidates.push(densePass);

  const sparsePass = await runTesseractPass(preprocessed, "on-device OCR processed (psm11)", 11);
  if (sparsePass.lines.length) candidates.push(sparsePass);

  if (!candidates.length) {
    throw new Error("No text detected. Try a clearer photo in better lighting.");
  }

  const ranked = candidates.map(extractionScore).sort((a, b) => b.score - a.score);
  const best = ranked[0];
  if (cloudWarning) best.fallbackNote = `Cloud OCR unavailable, used on-device. ${cloudWarning}`;
  return best;
}

// ──────────────────────────────────────────────
// SHOPPING LIST LOGIC
// ──────────────────────────────────────────────

function parseAmount(v) {
  const n = String(v || "").trim();
  if (!n) return null;
  if (/^\d+(\.\d+)?$/.test(n)) return Number(n);
  if (/^\d+-\d+\/\d+$/.test(n)) { const [w, f] = n.split("-"); const [num, den] = f.split("/").map(Number); return den ? Number(w) + num / den : null; }
  if (/^\d+\/\d+$/.test(n)) { const [num, den] = n.split("/").map(Number); return den ? num / den : null; }
  if (/^\d+\s+\d+\/\d+$/.test(n)) { const [w, f] = n.split(/\s+/); const [num, den] = f.split("/").map(Number); return den ? Number(w) + num / den : null; }
  return null;
}

function formatAmount(v) {
  if (!Number.isFinite(v)) return null;
  if (Math.round(v) === v) return String(Math.round(v));
  return v.toFixed(2).replace(/\.?0+$/, "");
}

function combineQuantities(a, b) {
  const l = trimToNull(a), r = trimToNull(b);
  if (!l && !r) return null;
  if (!l) return r;
  if (!r) return l;
  const la = parseAmount(l), ra = parseAmount(r);
  return la !== null && ra !== null ? formatAmount(la + ra) : `${l} + ${r}`;
}

function shoppingListFromRecipe(recipe) {
  return {
    id: uid(), createdAt: new Date().toISOString(),
    items: recipe.ingredients.filter((i) => i.name?.trim()).map((i) => ({
      id: uid(), name: i.name.trim(), quantity: trimToNull(i.quantity),
      unit: trimToNull(i.unit), isChecked: false, sourceRecipeIDs: [recipe.id],
    })),
  };
}

function mergeShoppingListFromRecipes(recipes) {
  const index = new Map();
  for (const recipe of recipes) {
    for (const ing of recipe.ingredients) {
      const name = String(ing.name || "").trim();
      if (!name) continue;
      const unit = trimToNull(ing.unit);
      const key = `${name.toLowerCase().replace(/\s+/g, " ")}|${(unit || "-").toLowerCase()}`;
      const existing = index.get(key);
      if (!existing) {
        index.set(key, { id: uid(), name, quantity: trimToNull(ing.quantity), unit, isChecked: false, sourceRecipeIDs: [recipe.id] });
      } else {
        existing.quantity = combineQuantities(existing.quantity, ing.quantity);
        if (!existing.sourceRecipeIDs.includes(recipe.id)) existing.sourceRecipeIDs.push(recipe.id);
      }
    }
  }
  return {
    id: uid(), createdAt: new Date().toISOString(),
    items: Array.from(index.values()).sort((a, b) => a.name.localeCompare(b.name)),
  };
}

function enrichIngredientFields(ing) {
  const enriched = { ...ing };
  const missingQty = !trimToNull(enriched.quantity);
  const missingUnit = !trimToNull(enriched.unit);
  if (!enriched.rawLine || (!missingQty && !missingUnit)) return enriched;
  const reparsed = parseIngredientLine(String(enriched.rawLine), enriched.confidence || 0.6);
  if (!reparsed) return enriched;
  if (missingQty && trimToNull(reparsed.quantity)) enriched.quantity = trimToNull(reparsed.quantity);
  if (missingUnit && trimToNull(reparsed.unit)) enriched.unit = trimToNull(reparsed.unit);
  return enriched;
}

function deriveRecipeName(rawText) {
  const lines = String(rawText || "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return "Untitled Recipe";
  const first = lines[0];
  if (first.length > 40 && lines[1]) return lines[1].slice(0, 40);
  return first.slice(0, 40);
}

// ──────────────────────────────────────────────
// RENDER FUNCTIONS
// ──────────────────────────────────────────────

function confidenceClass(v) { return v >= 0.8 ? "conf-high" : v >= 0.5 ? "conf-mid" : "conf-low"; }

function quantityLabel(item) {
  const j = [item.quantity || "", item.unit || ""].join(" ").trim();
  return j || "—";
}

function renderViews() {
  const active = state.ui.activeView;
  dom.views.forEach((v) => v.classList.toggle("active", v.id === active));
  dom.tabs.forEach((t) => t.classList.toggle("active", t.dataset.view === active));
}

function renderNav() {
  const meta = NAV_META[state.ui.activeView] || NAV_META["scan-view"];
  dom.navTitle.textContent = meta.title;
  if (!meta.action) { setHidden(dom.navAction, true); return; }
  setHidden(dom.navAction, false);
  if (meta.action === "merge") {
    dom.navAction.textContent = "Merge All";
    dom.navAction.disabled = state.recipes.length < 2;
    dom.navAction.style.color = "";
  } else if (meta.action === "clear") {
    dom.navAction.textContent = "Clear";
    dom.navAction.disabled = !state.activeShoppingList;
    dom.navAction.style.color = "var(--danger)";
  }
}

function renderScanImage() {
  const images = state.selectedImages;

  if (images.length > 0) {
    setHidden(dom.photoGrid, false);
    dom.photoGrid.innerHTML = images.map((url, i) => `
      <div class="photo-thumb">
        <img src="${escapeHtml(url)}" alt="Photo ${i + 1}">
        <button class="remove-photo" data-action="remove-photo" data-index="${i}">✕</button>
      </div>
    `).join("") + `
      <button class="photo-thumb-add" id="add-more-photos-btn" title="Add more photos">+</button>
    `;
    dom.imagePreview.innerHTML = "";
    setHidden(dom.imagePreview, true);
  } else if (state.selectedImageDataUrl) {
    setHidden(dom.photoGrid, true);
    setHidden(dom.imagePreview, false);
    dom.imagePreview.innerHTML = `<img src="${escapeHtml(state.selectedImageDataUrl)}" alt="Recipe image">`;
  } else {
    setHidden(dom.photoGrid, true);
    setHidden(dom.imagePreview, false);
    dom.imagePreview.innerHTML = `
      <div class="placeholder" id="image-placeholder">
        <div class="placeholder-icon">📋</div>
        <p>No image selected</p>
        <button class="btn btn-ghost" id="try-sample-btn">Try with Sample Recipe</button>
      </div>`;
    const btn = document.getElementById("try-sample-btn");
    if (btn) btn.addEventListener("click", loadSampleRecipe);
  }
}

function renderScanStatus() {
  dom.extractBtn.disabled = (!state.selectedImageDataUrl && !state.selectedImages.length) || state.isProcessing;
  dom.extractBtn.textContent = state.isProcessing ? "Processing…" : "Extract Ingredients";
  dom.extractProgress.textContent = state.ui.extractProgress || "";

  const warn = state.lowConfidenceWarning || "";
  dom.warningMsg.textContent = warn;
  setHidden(dom.warningMsg, !warn);

  const err = state.scanErrorMessage || "";
  dom.errorMsg.textContent = err;
  setHidden(dom.errorMsg, !err);

  if (state.ocrConfidence > 0) {
    setHidden(dom.confidenceBox, false);
    const pct = Math.round(state.ocrConfidence * 100);
    dom.ocrConfValue.textContent = `${pct}%`;
    dom.ocrConfBar.style.width = `${pct}%`;
    dom.ocrSourceLabel.textContent = `source: ${state.ocrSource || "—"}`;
  } else {
    setHidden(dom.confidenceBox, true);
  }
}

function renderScanMode() {
  const isRecipe = state.scanMode === "recipe";
  dom.modeRecipeBtn.classList.toggle("active", isRecipe);
  dom.modeMealBtn.classList.toggle("active", !isRecipe);
  setHidden(dom.recipeMode, !isRecipe);
  setHidden(dom.mealMode, isRecipe);
}

function renderMealMode() {
  if (state.scanMode !== "meal") return;

  if (state.mealImageDataUrl) {
    dom.mealImagePreview.innerHTML = `<img src="${escapeHtml(state.mealImageDataUrl)}" alt="Meal photo">`;
    dom.analyzeMealBtn.disabled = state.isProcessing;
  } else {
    dom.mealImagePreview.innerHTML = `
      <div class="placeholder">
        <div class="placeholder-icon">🍽️</div>
        <p>No meal photo selected</p>
        <button class="btn btn-ghost" id="try-sample-meal-btn">Try with Sample Meal</button>
      </div>`;
    dom.analyzeMealBtn.disabled = true;
    const btn = document.getElementById("try-sample-meal-btn");
    if (btn) btn.addEventListener("click", loadSampleMeal);
  }

  dom.analyzeMealBtn.textContent = state.isProcessing ? "Analyzing…" : "🤖 Identify Meal & Generate Recipe";
  dom.mealProgress.textContent = state.ui.mealProgress || "";

  const err = state.ui.mealError || "";
  dom.mealErrorMsg.textContent = err;
  setHidden(dom.mealErrorMsg, !err);
}

function renderRecipes() {
  if (!state.recipes.length) {
    setHidden(dom.recipesEmpty, false);
    dom.recipesList.innerHTML = "";
    return;
  }
  setHidden(dom.recipesEmpty, true);
  dom.recipesList.innerHTML = state.recipes.map((r) => `
    <article class="recipe-card" data-recipe-id="${escapeHtml(r.id)}">
      <h4>${escapeHtml(r.name)}</h4>
      <p class="recipe-meta">${r.ingredients.length} ingredient${r.ingredients.length !== 1 ? "s" : ""} · ${escapeHtml(formatDate(r.createdAt))}</p>
      <div class="recipe-actions">
        <button class="btn btn-secondary btn-mini" data-action="open-detail" data-recipe-id="${escapeHtml(r.id)}">View</button>
        <button class="btn btn-secondary btn-mini" data-action="generate-list" data-recipe-id="${escapeHtml(r.id)}">Shop</button>
        <button class="btn btn-danger btn-mini" data-action="delete-recipe" data-recipe-id="${escapeHtml(r.id)}">Delete</button>
      </div>
    </article>
  `).join("");
}

function renderShopping() {
  const list = state.activeShoppingList;
  if (!list || !Array.isArray(list.items) || !list.items.length) {
    setHidden(dom.shoppingEmpty, false);
    setHidden(dom.shoppingSummary, true);
    dom.shoppingList.innerHTML = "";
    return;
  }

  setHidden(dom.shoppingEmpty, true);
  const total = list.items.length;
  const checked = list.items.filter((i) => i.isChecked).length;
  const pct = total ? Math.round((checked / total) * 100) : 0;
  const circumference = 2 * Math.PI * 17;
  const offset = circumference - (pct / 100) * circumference;

  setHidden(dom.shoppingSummary, false);
  dom.shoppingSummary.innerHTML = `
    <svg class="shopping-progress-ring" viewBox="0 0 44 44">
      <circle class="ring-bg" cx="22" cy="22" r="17"/>
      <circle class="ring-fill" cx="22" cy="22" r="17"
        stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"/>
    </svg>
    <div class="shopping-summary-text">
      <strong>${checked} of ${total} items</strong>
      <p>${pct}% complete</p>
    </div>
  `;

  dom.shoppingList.innerHTML = list.items.map((item) => `
    <label class="shopping-item">
      <input type="checkbox" data-action="toggle-item" data-item-id="${escapeHtml(item.id)}" ${item.isChecked ? "checked" : ""}>
      <div class="item-info">
        <div class="item-name ${item.isChecked ? "checked" : ""}">${escapeHtml(item.name)}</div>
        <div class="item-qty">${escapeHtml(quantityLabel(item))}</div>
      </div>
    </label>
  `).join("");
}

function renderSettings() {
  dom.cloudToggle.checked = !!state.settings.useCloudFallback;
  dom.thresholdSlider.value = String(state.settings.lowConfidenceThreshold);
  dom.thresholdValue.textContent = String(Math.round(state.settings.lowConfidenceThreshold * 100));
  if (dom.logsPreview) {
    const tail = state.logs.slice(-20);
    dom.logsPreview.textContent = tail.length
      ? tail.map((entry) => JSON.stringify(entry)).join("\n")
      : "No logs yet.";
  }
}

function renderEditor() {
  setHidden(dom.editorSheet, !state.showEditor);
  if (!state.showEditor) return;
  dom.editorSave.disabled = state.draftIngredients.length === 0;
  dom.recipeNameInput.value = state.draftRecipeName;
  dom.ingredientCountBadge.textContent = String(state.draftIngredients.length);

  dom.ingredientList.innerHTML = state.draftIngredients.map((ing, idx) => {
    const pct = Math.round((ing.confidence || 0) * 100);
    return `
      <div class="ingredient-row" data-index="${idx}">
        <div class="ingredient-fields">
          <input type="text" placeholder="Qty" data-field="quantity" data-index="${idx}" value="${escapeHtml(ing.quantity || "")}">
          <input type="text" placeholder="Unit" data-field="unit" data-index="${idx}" value="${escapeHtml(ing.unit || "")}">
          <input type="text" placeholder="Ingredient" data-field="name" data-index="${idx}" value="${escapeHtml(ing.name || "")}">
          <button class="ingredient-delete" data-action="delete-ingredient" data-index="${idx}">✕</button>
        </div>
        <div class="confidence-row">
          <span>Confidence</span>
          <span class="${confidenceClass(ing.confidence || 0)}">${pct}%</span>
        </div>
      </div>`;
  }).join("");

  const dropped = state.droppedOCRLines || [];
  if (dropped.length) {
    setHidden(dom.droppedLinesBox, false);
    dom.droppedLinesList.innerHTML = dropped.map((l) => `<li>${escapeHtml(l)}</li>`).join("");
    dom.droppedLinesBox.open = true;
  } else {
    setHidden(dom.droppedLinesBox, true);
  }

  // Steps section
  const steps = state.draftSteps || [];
  if (steps.length > 0) {
    setHidden(dom.stepsSection, false);
    dom.stepsCountBadge.textContent = String(steps.length);
    dom.stepsList.innerHTML = steps.map((s) => `
      <div class="step-card">
        <div class="step-header">
          <span class="step-number">${s.step}</span>
          <div class="step-badges">
            ${s.temperature ? `<span class="step-badge step-badge-temp">🌡️ ${escapeHtml(s.temperature)}</span>` : ""}
            ${s.duration ? `<span class="step-badge step-badge-time">⏱️ ${escapeHtml(s.duration)}</span>` : ""}
          </div>
        </div>
        <p class="step-instruction">${escapeHtml(s.instruction)}</p>
      </div>
    `).join("");
  } else {
    setHidden(dom.stepsSection, true);
  }
}

function renderRecipeDetail() {
  const recipe = state.detail.recipeId
    ? state.recipes.find((r) => r.id === state.detail.recipeId) : null;
  if (!recipe) { setHidden(dom.detailSheet, true); return; }

  setHidden(dom.detailSheet, false);
  dom.detailTitle.textContent = recipe.name;

  if (recipe.imageDataUrl) {
    dom.detailImagePreview.innerHTML = `<img src="${escapeHtml(recipe.imageDataUrl)}" alt="Recipe image">`;
    setHidden(dom.detailImagePreview, false);
  } else {
    dom.detailImagePreview.innerHTML = "";
    setHidden(dom.detailImagePreview, true);
  }

  dom.detailIngredients.innerHTML = recipe.ingredients.map((ing) => `
    <div class="detail-ingredient">
      <strong>${escapeHtml(ing.name)}</strong>
      <p class="recipe-meta">${escapeHtml(quantityLabel(ing))}</p>
    </div>
  `).join("");

  // Meta pills (cuisine, servings, prep/cook time)
  const meta = recipe.meta;
  if (meta) {
    setHidden(dom.detailMeta, false);
    dom.detailMeta.innerHTML = [
      meta.cuisine ? `<span class="meta-pill"><span class="meta-pill-icon">🌍</span>${escapeHtml(meta.cuisine)}</span>` : "",
      meta.servings ? `<span class="meta-pill"><span class="meta-pill-icon">🍽️</span>${meta.servings} servings</span>` : "",
      meta.prepTime ? `<span class="meta-pill"><span class="meta-pill-icon">⏱️</span>Prep: ${escapeHtml(meta.prepTime)}</span>` : "",
      meta.cookTime ? `<span class="meta-pill"><span class="meta-pill-icon">🔥</span>Cook: ${escapeHtml(meta.cookTime)}</span>` : "",
    ].filter(Boolean).join("");
  } else {
    setHidden(dom.detailMeta, true);
  }

  // Steps
  const steps = recipe.steps || [];
  if (steps.length > 0) {
    setHidden(dom.detailStepsSection, false);
    dom.detailSteps.innerHTML = steps.map((s) => `
      <div class="step-card">
        <div class="step-header">
          <span class="step-number">${s.step}</span>
          <div class="step-badges">
            ${s.temperature ? `<span class="step-badge step-badge-temp">🌡️ ${escapeHtml(s.temperature)}</span>` : ""}
            ${s.duration ? `<span class="step-badge step-badge-time">⏱️ ${escapeHtml(s.duration)}</span>` : ""}
          </div>
        </div>
        <p class="step-instruction">${escapeHtml(s.instruction)}</p>
      </div>
    `).join("");
  } else {
    setHidden(dom.detailStepsSection, true);
  }
}

function renderAll() {
  renderViews();
  renderNav();
  renderScanMode();
  renderScanImage();
  renderScanStatus();
  renderMealMode();
  renderRecipes();
  renderShopping();
  renderSettings();
  renderEditor();
  renderRecipeDetail();
}

// ──────────────────────────────────────────────
// ACTIONS
// ──────────────────────────────────────────────

function showView(viewId) {
  if (!NAV_META[viewId]) return;
  state.ui.activeView = viewId;
  logEvent("info", "view_changed", { view: viewId });
  saveState();
  renderAll();
}

function setSelectedImage(dataUrl) {
  state.selectedImageDataUrl = dataUrl || null;
  state.selectedImages = dataUrl ? [dataUrl] : [];
  state.lowConfidenceWarning = null;
  state.scanErrorMessage = null;
  state.ui.extractProgress = "";
  state.ocrConfidence = 0;
  state.ocrSource = null;
}

async function onSelectImageFile(input) {
  const files = Array.from(input.files || []);
  if (!files.length) return;
  try {
    for (const file of files) {
      if (state.selectedImages.length >= 8) break;
      const dataUrl = await readFileAsDataUrl(file);
      state.selectedImages.push(dataUrl);
    }
    state.selectedImageDataUrl = state.selectedImages[0] || null;
    state.usedSample = false;
    state.lowConfidenceWarning = null;
    state.scanErrorMessage = null;
    state.ui.extractProgress = "";
    state.ocrConfidence = 0;
    state.ocrSource = null;
    logEvent("info", "image_selected", { image_count: state.selectedImages.length });
    saveState();
    renderAll();
  } catch (e) {
    state.scanErrorMessage = e.message || "Failed to read image.";
    logEvent("error", "image_select_failed", { error: state.scanErrorMessage });
    renderScanStatus();
  } finally { input.value = ""; }
}

function loadSampleRecipe() {
  // Build lines from sample text and directly parse
  const lines = SAMPLE_RECIPE_TEXT.split("\n").map((l) => l.trim()).filter(Boolean);
  const ocrLines = lines.map((l) => ({ text: l, confidence: 0.95 }));
  const parseResult = parseIngredientsFromLines(ocrLines);

  state.usedSample = true;
  state.selectedImageDataUrl = null;
  state.selectedImages = [];
  state.rawOCRText = SAMPLE_RECIPE_TEXT;
  state.ocrConfidence = 0.95;
  state.ocrSource = "sample recipe (built-in)";
  state.draftIngredients = parseResult.ingredients;
  state.droppedOCRLines = parseResult.droppedLines;
  state.draftRecipeName = deriveRecipeName(SAMPLE_RECIPE_TEXT);
  state.lowConfidenceWarning = null;
  state.scanErrorMessage = null;
  state.draftSteps = [];
  state.showEditor = true;
  logEvent("info", "sample_recipe_loaded");

  saveState();
  renderAll();
}

async function processSelectedImage() {
  const images = state.selectedImages.length > 0 ? state.selectedImages :
    (state.selectedImageDataUrl ? [state.selectedImageDataUrl] : []);

  if (!images.length) {
    state.scanErrorMessage = "Select or capture a recipe image first.";
    logEvent("warning", "ocr_no_image_selected");
    renderAll();
    return;
  }

  state.isProcessing = true;
  state.scanErrorMessage = null;
  state.lowConfidenceWarning = null;
  state.ui.extractProgress = "Initializing OCR…";
  logEvent("info", "ocr_started", { image_count: images.length });
  renderAll();

  try {
    let allLines = [];
    let allRawText = "";
    let totalConfidence = 0;
    let source = null;
    let fallbackNote = null;
    let allStructuredIngredients = [];
    let allStructuredDropped = [];

    for (let i = 0; i < images.length; i++) {
      if (images.length > 1) {
        state.ui.extractProgress = `Processing image ${i + 1} of ${images.length}…`;
        renderScanStatus();
      }
      const extraction = await runOCRExtraction(images[i]);
      allRawText += (allRawText ? "\n" : "") + extraction.rawText;
      totalConfidence += extraction.averageConfidence;
      source = extraction.source;
      if (extraction.fallbackNote) fallbackNote = extraction.fallbackNote;

      if (Array.isArray(extraction.ingredients) && extraction.ingredients.length > 0) {
        allStructuredIngredients.push(...extraction.ingredients);
        if (Array.isArray(extraction.droppedLines)) allStructuredDropped.push(...extraction.droppedLines);
      }
      if (extraction.lines) allLines.push(...extraction.lines);
    }

    const avgConfidence = totalConfidence / images.length;
    const hasStructured = allStructuredIngredients.length > 0;
    const parseResult = parseIngredientsFromLines(allLines);
    const metrics = parseResult.metrics || {};
    const effectiveIngredients = hasStructured ? allStructuredIngredients : parseResult.ingredients;
    const effectiveDropped = hasStructured ? allStructuredDropped : parseResult.droppedLines;
    const effectiveMetrics = hasStructured ? {} : metrics;

    state.rawOCRText = allRawText;
    state.ocrConfidence = avgConfidence;
    state.ocrSource = source + (images.length > 1 ? ` (${images.length} images)` : "");
    state.draftIngredients = effectiveIngredients;
    state.droppedOCRLines = effectiveDropped;
    state.draftRecipeName = deriveRecipeName(allRawText);
    state.draftSteps = [];
    if (fallbackNote) state.lowConfidenceWarning = fallbackNote;

    const ic = Number.isFinite(effectiveMetrics.ingredientCount) ? effectiveMetrics.ingredientCount : effectiveIngredients.length;
    const hasMeasured = effectiveIngredients.some((i) => !!trimToNull(i.quantity) || !!trimToNull(i.unit));
    const tooNoisy = ic === 0 || (ic === 1 && !hasMeasured &&
      ((effectiveMetrics.avgConfidence || 0) < 0.45 || (effectiveMetrics.qualityScore || 0) < 0.42));

    if (!effectiveIngredients.length || tooNoisy) {
      state.scanErrorMessage = `No ingredient lines found from ${source || "OCR"}. Try clearer images or add ingredients manually.`;
      state.showEditor = false;
      logEvent("warning", "ocr_no_ingredients", { source: source || "unknown" });
      return;
    }

    if (avgConfidence < state.settings.lowConfidenceThreshold) {
      state.lowConfidenceWarning = "Low OCR confidence — review extracted lines before saving.";
      logEvent("warning", "ocr_low_confidence", {
        confidence: avgConfidence.toFixed(2),
        source: source || "unknown",
      });
    } else if ((effectiveMetrics.avgNameQuality || 0) < 0.62) {
      state.lowConfidenceWarning = "Ingredient text quality is low — verify each line.";
      logEvent("warning", "ocr_low_name_quality", {
        avg_name_quality: String((effectiveMetrics.avgNameQuality || 0).toFixed(2)),
      });
    }

    state.showEditor = true;
    logEvent("info", "ocr_completed", {
      ingredient_count: effectiveIngredients.length,
      source: source || "unknown",
      confidence: avgConfidence.toFixed(2),
    });
  } catch (e) {
    state.scanErrorMessage = (e instanceof Error ? e.message : String(e)) ||
      "No readable text detected. Use a recipe screenshot with visible ingredients.";
    logEvent("error", "ocr_failed", { error: state.scanErrorMessage });
  } finally {
    state.isProcessing = false;
    state.ui.extractProgress = "";
    saveState();
    renderAll();
  }
}

// ─── Scan Mode Switching ───
function switchScanMode(mode) {
  if (mode !== "recipe" && mode !== "meal") return;
  state.scanMode = mode;
  renderAll();
}

function removePhotoFromGrid(index) {
  if (index < 0 || index >= state.selectedImages.length) return;
  state.selectedImages.splice(index, 1);
  state.selectedImageDataUrl = state.selectedImages[0] || null;
  if (!state.selectedImages.length) {
    state.ocrConfidence = 0;
    state.ocrSource = null;
  }
  renderAll();
}

// ─── Meal Identification ───
async function onSelectMealImageFile(input) {
  const file = input.files?.[0];
  if (!file) return;
  try {
    state.mealImageDataUrl = await readFileAsDataUrl(file);
    state.ui.mealError = null;
    logEvent("info", "meal_image_selected");
    renderAll();
  } catch (e) {
    state.ui.mealError = e.message || "Failed to read image.";
    logEvent("error", "meal_image_select_failed", { error: state.ui.mealError });
    renderMealMode();
  } finally { input.value = ""; }
}

function loadSampleMeal() {
  const meal = SAMPLE_MEAL_ANALYSIS;
  state.mealAnalysis = meal;
  state.draftRecipeName = meal.name;
  state.draftIngredients = meal.ingredients.map((ing) => ({
    id: uid(),
    name: ing.name,
    quantity: ing.quantity || null,
    unit: ing.unit || null,
    confidence: 0.95,
    rawLine: `${ing.quantity || ""} ${ing.unit || ""} ${ing.name}`.trim(),
  }));
  state.draftSteps = meal.steps || [];
  state.usedSample = true;
  state.showEditor = true;
  logEvent("info", "sample_meal_loaded");
  renderAll();
}

async function runMealAnalysis(imageDataUrl) {
  const body = JSON.stringify({ imageDataUrl });
  const response = await fetch(MEAL_API_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  const data = await response.json();
  if (!data.ok) throw new Error(data.error || "Meal analysis failed");
  return data;
}

async function processMealImage() {
  if (!state.mealImageDataUrl) {
    state.ui.mealError = "Select a meal photo first.";
    logEvent("warning", "meal_no_image_selected");
    renderMealMode();
    return;
  }

  state.isProcessing = true;
  state.ui.mealError = null;
  state.ui.mealProgress = "Sending to AI for analysis…";
  logEvent("info", "meal_analysis_started");
  renderAll();

  try {
    const result = await runMealAnalysis(state.mealImageDataUrl);
    state.mealAnalysis = result;
    state.draftRecipeName = result.name || "Identified Meal";
    state.draftIngredients = (result.ingredients || []).map((ing) => ({
      id: uid(),
      name: ing.name,
      quantity: ing.quantity || null,
      unit: ing.unit || null,
      confidence: 0.9,
      rawLine: `${ing.quantity || ""} ${ing.unit || ""} ${ing.name}`.trim(),
    }));
    state.draftSteps = result.steps || [];
    state.showEditor = true;
    logEvent("info", "meal_analysis_completed", {
      recipe_name: result.name || "Identified Meal",
      ingredient_count: (result.ingredients || []).length,
    });
  } catch (e) {
    state.ui.mealError = (e instanceof Error ? e.message : String(e)) ||
      "Meal analysis failed. Check your API key and try again.";
    logEvent("error", "meal_analysis_failed", { error: state.ui.mealError });
  } finally {
    state.isProcessing = false;
    state.ui.mealProgress = "";
    saveState();
    renderAll();
  }
}

function addBlankIngredient() {
  state.draftIngredients.push({ id: uid(), name: "", quantity: null, unit: null, confidence: 0.5, rawLine: null });
  renderEditor();
}

function removeIngredient(idx) {
  if (idx < 0 || idx >= state.draftIngredients.length) return;
  state.draftIngredients.splice(idx, 1);
  renderEditor();
}

function saveRecipeAndGenerateList() {
  const name = state.draftRecipeName.trim() || "Untitled Recipe";
  const sanitized = state.draftIngredients
    .map(enrichIngredientFields)
    .map((i) => ({ ...i, name: String(i.name || "").trim(), quantity: trimToNull(i.quantity), unit: trimToNull(i.unit) }))
    .filter((i) => i.name);
  const reliable = sanitized.filter((i) => ingredientNameQuality(i.name) >= 0.5);

  if (!reliable.length) {
    window.alert("Add at least one readable ingredient before saving.");
    return;
  }

  const recipe = {
    id: uid(), name, createdAt: new Date().toISOString(),
    ingredients: reliable,
    imageDataUrl: state.selectedImageDataUrl,
    steps: state.draftSteps || [],
    meta: state.mealAnalysis
      ? { cuisine: state.mealAnalysis.cuisine, servings: state.mealAnalysis.servings, prepTime: state.mealAnalysis.prepTime, cookTime: state.mealAnalysis.cookTime }
      : null,
  };
  state.recipes.unshift(recipe);
  if (state.recipes.length > 50) state.recipes = state.recipes.slice(0, 50);

  state.activeShoppingList = shoppingListFromRecipe(recipe);
  state.showEditor = false;
  state.selectedImageDataUrl = null;
  state.selectedImages = [];
  state.rawOCRText = "";
  state.droppedOCRLines = [];
  state.ocrConfidence = 0;
  state.ocrSource = null;
  state.scanErrorMessage = null;
  state.lowConfidenceWarning = null;
  state.draftRecipeName = "";
  state.draftIngredients = [];
  state.draftSteps = [];
  state.mealAnalysis = null;
  state.mealImageDataUrl = null;
  state.usedSample = false;

  logEvent("info", "recipe_saved", {
    recipe_id: recipe.id,
    ingredient_count: recipe.ingredients.length,
  });
  saveState();
  showView("shopping-view");
}

function closeEditor() {
  state.showEditor = false;
  renderAll();
}

function openDetail(recipeId) {
  if (!state.recipes.find((r) => r.id === recipeId)) return;
  state.detail.recipeId = recipeId;
  renderAll();
}

function closeDetail() {
  state.detail.recipeId = null;
  renderAll();
}

function regenerateShoppingList(recipeId) {
  const recipe = state.recipes.find((r) => r.id === recipeId);
  if (!recipe) return;
  state.activeShoppingList = shoppingListFromRecipe(recipe);
  logEvent("info", "shopping_list_regenerated", { recipe_id: recipeId });
  saveState();
  showView("shopping-view");
}

function mergeAllRecipes() {
  if (state.recipes.length < 2) return;
  state.activeShoppingList = mergeShoppingListFromRecipes(state.recipes);
  logEvent("info", "shopping_list_merged", { recipe_count: state.recipes.length });
  saveState();
  showView("shopping-view");
}

function deleteRecipe(recipeId) {
  state.recipes = state.recipes.filter((r) => r.id !== recipeId);
  if (state.detail.recipeId === recipeId) state.detail.recipeId = null;
  logEvent("warning", "recipe_deleted", { recipe_id: recipeId });
  saveState();
  renderAll();
}

function toggleShoppingItem(itemId, checked) {
  const list = state.activeShoppingList;
  if (!list) return;
  const item = list.items.find((i) => i.id === itemId);
  if (!item) return;
  item.isChecked = !!checked;
  logEvent("info", "shopping_item_toggled", { item_id: itemId, checked: item.isChecked });
  saveState();
  renderShopping();
}

function clearShoppingList() {
  state.activeShoppingList = null;
  logEvent("warning", "shopping_list_cleared");
  saveState();
  renderAll();
}

function resetAllData() {
  localStorage.removeItem(STORAGE_KEY);
  Object.assign(state, makeDefaultState());
  logEvent("warning", "demo_data_reset");
  saveState();
  renderAll();
}

async function copyLogs() {
  const payload = state.logs.map((line) => JSON.stringify(line)).join("\n");
  try {
    await navigator.clipboard.writeText(payload || "No logs.");
    logEvent("info", "logs_copied", { line_count: state.logs.length });
  } catch {
    logEvent("warning", "logs_copy_failed");
  }
  saveState();
  renderSettings();
}

// ─── Confirm Dialog ───
function showConfirm(title, message, onOk) {
  state.pendingConfirm = onOk;
  dom.confirmTitle.textContent = title;
  dom.confirmMessage.textContent = message;
  setHidden(dom.confirmDialog, false);
}

function hideConfirm() {
  state.pendingConfirm = null;
  setHidden(dom.confirmDialog, true);
}

// ──────────────────────────────────────────────
// EVENT BINDING
// ──────────────────────────────────────────────

function bindEvents() {
  // Tab navigation
  dom.tabs.forEach((tab) => {
    tab.addEventListener("click", () => showView(tab.dataset.view));
  });

  // Nav action button
  dom.navAction.addEventListener("click", () => {
    const v = state.ui.activeView;
    if (v === "recipes-view") mergeAllRecipes();
    else if (v === "shopping-view") {
      showConfirm("Clear Shopping List?", "This removes the active list. Saved recipes remain.", clearShoppingList);
    }
  });

  // Camera / import
  dom.openCameraBtn.addEventListener("click", () => dom.cameraInput.click());
  dom.importPhotoBtn.addEventListener("click", () => dom.photoInput.click());
  dom.cameraInput.addEventListener("change", () => onSelectImageFile(dom.cameraInput));
  dom.photoInput.addEventListener("change", () => onSelectImageFile(dom.photoInput));

  // Sample recipe
  const sampleBtn = document.getElementById("try-sample-btn");
  if (sampleBtn) sampleBtn.addEventListener("click", loadSampleRecipe);

  // Extract
  dom.extractBtn.addEventListener("click", processSelectedImage);

  // Editor
  dom.editorClose.addEventListener("click", closeEditor);
  dom.editorSave.addEventListener("click", saveRecipeAndGenerateList);
  dom.recipeNameInput.addEventListener("input", () => { state.draftRecipeName = dom.recipeNameInput.value; });

  dom.ingredientList.addEventListener("input", (e) => {
    const t = e.target;
    if (!(t instanceof HTMLInputElement)) return;
    const idx = Number(t.dataset.index), field = t.dataset.field;
    if (!Number.isFinite(idx) || !field) return;
    const ing = state.draftIngredients[idx];
    if (!ing) return;
    if (field === "name") ing.name = t.value;
    if (field === "quantity") ing.quantity = trimToNull(t.value);
    if (field === "unit") ing.unit = trimToNull(t.value);
  });

  dom.ingredientList.addEventListener("click", (e) => {
    const t = e.target;
    if (!(t instanceof HTMLElement) || t.dataset.action !== "delete-ingredient") return;
    removeIngredient(Number(t.dataset.index));
  });

  dom.addIngredientBtn.addEventListener("click", addBlankIngredient);

  // Recipes list
  dom.recipesList.addEventListener("click", (e) => {
    const t = e.target;
    if (!(t instanceof HTMLElement)) return;
    const action = t.dataset.action, id = t.dataset.recipeId;
    if (!action || !id) return;
    if (action === "open-detail") openDetail(id);
    if (action === "generate-list") regenerateShoppingList(id);
    if (action === "delete-recipe") {
      showConfirm("Delete Recipe?", "This cannot be undone.", () => deleteRecipe(id));
    }
  });

  // Shopping list
  dom.shoppingList.addEventListener("change", (e) => {
    const t = e.target;
    if (!(t instanceof HTMLInputElement) || t.dataset.action !== "toggle-item") return;
    toggleShoppingItem(t.dataset.itemId, t.checked);
  });

  // Settings
  dom.cloudToggle.addEventListener("change", () => {
    state.settings.useCloudFallback = dom.cloudToggle.checked;
    saveState();
  });

  dom.thresholdSlider.addEventListener("input", () => {
    state.settings.lowConfidenceThreshold = clamp(Number(dom.thresholdSlider.value), 0.4, 0.95);
    dom.thresholdValue.textContent = String(Math.round(state.settings.lowConfidenceThreshold * 100));
    saveState();
  });

  dom.resetAllBtn.addEventListener("click", () => {
    showConfirm("Reset All Data?", "This clears all recipes, shopping lists, and settings.", resetAllData);
  });

  if (dom.copyLogsBtn) {
    dom.copyLogsBtn.addEventListener("click", () => { void copyLogs(); });
  }

  // Detail sheet
  dom.detailClose.addEventListener("click", closeDetail);
  dom.detailGenerate.addEventListener("click", () => {
    const recipe = state.detail.recipeId ? state.recipes.find((r) => r.id === state.detail.recipeId) : null;
    if (recipe) regenerateShoppingList(recipe.id);
  });

  // Confirm dialog
  dom.confirmCancel.addEventListener("click", hideConfirm);
  dom.confirmOk.addEventListener("click", () => {
    const fn = state.pendingConfirm;
    hideConfirm();
    if (typeof fn === "function") fn();
  });

  // ─── Mode Toggle ───
  dom.modeRecipeBtn.addEventListener("click", () => switchScanMode("recipe"));
  dom.modeMealBtn.addEventListener("click", () => switchScanMode("meal"));

  // ─── Photo Grid (remove & add more) ───
  dom.photoGrid.addEventListener("click", (e) => {
    const t = e.target;
    if (!(t instanceof HTMLElement)) return;
    if (t.dataset.action === "remove-photo") {
      removePhotoFromGrid(Number(t.dataset.index));
    }
    if (t.id === "add-more-photos-btn") {
      dom.photoInput.click();
    }
  });

  // ─── Meal Mode ───
  dom.mealCameraBtn.addEventListener("click", () => dom.mealCameraInput.click());
  dom.mealImportBtn.addEventListener("click", () => dom.mealPhotoInput.click());
  dom.mealCameraInput.addEventListener("change", () => onSelectMealImageFile(dom.mealCameraInput));
  dom.mealPhotoInput.addEventListener("change", () => onSelectMealImageFile(dom.mealPhotoInput));
  dom.analyzeMealBtn.addEventListener("click", processMealImage);

  const sampleMealBtn = document.getElementById("try-sample-meal-btn");
  if (sampleMealBtn) sampleMealBtn.addEventListener("click", loadSampleMeal);
}

// ──────────────────────────────────────────────
// INIT
// ──────────────────────────────────────────────

function init() {
  logEvent("info", "mobile_demo_loaded");
  bindEvents();
  renderAll();
}

init();
