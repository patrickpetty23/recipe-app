const STORAGE_KEY = "recipe-scanner-desktop.v1";
const MAX_LOGS = 240;

const VIEW_META = {
  "scan-view": {
    title: "Scan",
    subtitle: "Capture/import a recipe image and extract ingredients.",
  },
  "recipes-view": {
    title: "Recipes",
    subtitle: "Browse saved recipes and regenerate shopping lists.",
  },
  "shopping-view": {
    title: "Shopping",
    subtitle: "Use your persisted checklist while you shop.",
  },
  "settings-view": {
    title: "Settings",
    subtitle: "Tune extraction behavior and inspect debug logs.",
  },
};

const COMMON_UNITS = new Set([
  "c",
  "cup",
  "cups",
  "tbsp",
  "tablespoon",
  "tablespoons",
  "tsp",
  "teaspoon",
  "teaspoons",
  "oz",
  "ounce",
  "ounces",
  "lb",
  "lbs",
  "pound",
  "pounds",
  "g",
  "gram",
  "grams",
  "kg",
  "ml",
  "l",
  "clove",
  "cloves",
  "can",
  "cans",
  "pkg",
  "package",
  "packages",
  "pinch",
  "dash",
]);

const BLOCKED_PREFIXES = new Set([
  "instructions",
  "direction",
  "directions",
  "steps",
  "method",
  "serves",
  "yield",
  "nutrition",
  "notes",
  "tip",
  "tips",
  "ingredients",
]);

const STOP_WORDS = new Set([
  "for",
  "with",
  "and",
  "the",
  "a",
  "an",
  "to",
  "of",
  "fresh",
  "optional",
  "or",
  "plus",
  "room",
  "temperature",
  "chopped",
  "diced",
  "minced",
  "sliced",
  "large",
  "small",
  "medium",
]);

const INGREDIENT_HINT_WORDS = new Set([
  "flour",
  "sugar",
  "salt",
  "pepper",
  "oil",
  "olive",
  "garlic",
  "onion",
  "milk",
  "butter",
  "egg",
  "eggs",
  "water",
  "rice",
  "pasta",
  "tomato",
  "chicken",
  "beef",
  "pork",
  "cheese",
  "lemon",
  "lime",
  "vinegar",
  "basil",
  "parsley",
  "oregano",
  "paprika",
  "cumin",
  "coriander",
  "potato",
  "carrot",
  "celery",
  "broth",
  "stock",
  "cream",
  "yogurt",
  "honey",
  "vanilla",
  "baking",
  "powder",
  "soda",
  "yeast",
  "cornstarch",
  "beans",
  "lentils",
  "cilantro",
  "shrimp",
  "salmon",
  "tuna",
  "avocado",
  "spinach",
  "mushroom",
  "zucchini",
  "cabbage",
  "ginger",
  "chili",
  "chile",
]);

const SAMPLE_OCR_TEXT = `Classic Pancakes
2 cups flour
1 tbsp sugar
1/2 tsp salt
1 1/2 cups milk
2 eggs
2 tbsp melted butter`;

const FRACTION_MAP = {
  "¼": "1/4",
  "½": "1/2",
  "¾": "3/4",
  "⅓": "1/3",
  "⅔": "2/3",
  "⅛": "1/8",
  "⅜": "3/8",
  "⅝": "5/8",
  "⅞": "7/8",
};

const dom = {
  navButtons: Array.from(document.querySelectorAll(".nav-btn")),
  views: Array.from(document.querySelectorAll(".view")),
  viewTitle: document.getElementById("view-title"),
  viewSubtitle: document.getElementById("view-subtitle"),
  sessionPill: document.getElementById("session-pill"),
  statRecipes: document.getElementById("stat-recipes"),
  statShopping: document.getElementById("stat-shopping"),
  statChecked: document.getElementById("stat-checked"),
  statConfidence: document.getElementById("stat-confidence"),
  imageInput: document.getElementById("image-input"),
  clearImageBtn: document.getElementById("clear-image"),
  selectedImageName: document.getElementById("selected-image-name"),
  imagePreview: document.getElementById("image-preview"),
  ocrInput: document.getElementById("ocr-input"),
  extractBtn: document.getElementById("extract-btn"),
  extractProgress: document.getElementById("extract-progress"),
  extractMessage: document.getElementById("extract-message"),
  ocrConfidenceDisplay: document.getElementById("ocr-confidence-display"),
  ocrSourceDisplay: document.getElementById("ocr-source-display"),
  metricTotalLines: document.getElementById("metric-total-lines"),
  metricParsedLines: document.getElementById("metric-parsed-lines"),
  metricDroppedLines: document.getElementById("metric-dropped-lines"),
  metricQtyCoverage: document.getElementById("metric-qty-coverage"),
  metricUnitCoverage: document.getElementById("metric-unit-coverage"),
  metricQualityScore: document.getElementById("metric-quality-score"),
  editorCard: document.getElementById("editor-card"),
  recipeNameInput: document.getElementById("recipe-name-input"),
  ingredientRows: document.getElementById("ingredient-rows"),
  addIngredientBtn: document.getElementById("add-ingredient"),
  saveDraftBtn: document.getElementById("save-draft"),
  discardDraftBtn: document.getElementById("discard-draft"),
  draftHint: document.getElementById("draft-hint"),
  droppedLinesBox: document.getElementById("dropped-lines-box"),
  droppedLinesList: document.getElementById("dropped-lines-list"),
  recipesList: document.getElementById("recipes-list"),
  mergeAllBtn: document.getElementById("merge-all"),
  shoppingList: document.getElementById("shopping-list"),
  clearShoppingBtn: document.getElementById("clear-shopping"),
  cloudFallbackToggle: document.getElementById("cloud-fallback-toggle"),
  thresholdInput: document.getElementById("threshold-input"),
  thresholdValue: document.getElementById("threshold-value"),
  copyLogsBtn: document.getElementById("copy-logs"),
  resetDemoBtn: document.getElementById("reset-demo"),
  logsPreview: document.getElementById("logs-preview"),
};

const uid = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

function makeDefaultState() {
  return {
    recipes: [],
    activeShoppingList: null,
    settings: {
      useCloudFallback: false,
      lowConfidenceThreshold: 0.7,
    },
    logs: [],
    scan: {
      selectedImageDataUrl: null,
      selectedImageName: "",
      lastOCRConfidence: null,
      lastOCRSource: null,
      lastMetrics: null,
    },
    draft: null,
    ui: {
      activeView: "scan-view",
      sessionText: "Ready",
      sessionTone: "ready",
    },
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
      ...parsed,
      settings: { ...fallback.settings, ...(parsed.settings || {}) },
      scan: { ...fallback.scan, ...(parsed.scan || {}) },
      ui: { ...fallback.ui, ...(parsed.ui || {}) },
      logs: Array.isArray(parsed.logs) ? parsed.logs : [],
      recipes: Array.isArray(parsed.recipes) ? parsed.recipes : [],
    };
  } catch {
    return fallback;
  }
}

let state = loadState();

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function logEvent(level, event, metadata = {}) {
  state.logs.push({
    timestamp: new Date().toISOString(),
    level,
    event,
    metadata,
  });
  if (state.logs.length > MAX_LOGS) {
    state.logs = state.logs.slice(state.logs.length - MAX_LOGS);
  }
}

function setSession(text, tone = "ready") {
  state.ui.sessionText = text;
  state.ui.sessionTone = tone;
  dom.sessionPill.textContent = text;
  dom.sessionPill.className = "pill";
  if (tone !== "ready") {
    dom.sessionPill.classList.add(tone);
  }
}

function setMessage(text, kind = "") {
  dom.extractMessage.textContent = text;
  dom.extractMessage.className = "message";
  if (kind) dom.extractMessage.classList.add(kind);
}

function showView(viewId) {
  state.ui.activeView = viewId;
  dom.views.forEach((view) => view.classList.toggle("active", view.id === viewId));
  dom.navButtons.forEach((btn) => btn.classList.toggle("active", btn.dataset.viewTarget === viewId));
  const meta = VIEW_META[viewId];
  dom.viewTitle.textContent = meta.title;
  dom.viewSubtitle.textContent = meta.subtitle;
  saveState();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function normalizeText(text) {
  let value = text.trim();
  value = value
    .replace(/(\d)([¼½¾⅓⅔⅛⅜⅝⅞])/g, "$1 $2")
    .replace(/([¼½¾⅓⅔⅛⅜⅝⅞])(\d)/g, "$1 $2");
  Object.entries(FRACTION_MAP).forEach(([k, v]) => {
    value = value.replaceAll(k, v);
  });
  value = value
    .replaceAll("•", " ")
    .replaceAll("—", " ")
    .replaceAll("\t", " ")
    .replace(/\s+/g, " ")
    .trim();

  value = normalizeOcrArtifacts(value);
  return value;
}

function normalizeOcrArtifacts(text) {
  let value = text;
  value = value
    .replace(/\b[I|l](?=\/\d)/g, "1")
    .replace(/\bO(?=\d)/g, "0")
    .replace(/(\d)\s*-\s*(\d+\/\d+)/g, "$1-$2")
    .replace(/(\d)\s*([xX])\s*(\d)/g, "$1-$3");
  return value;
}

function tokenizeAlpha(text) {
  return (text.toLowerCase().match(/[a-z]+/g) || []).filter(Boolean);
}

function symbolRatio(text) {
  if (!text.length) return 1;
  const symbols = (text.match(/[^a-zA-Z0-9\s./,()\-]/g) || []).length;
  return symbols / text.length;
}

function hasGibberishToken(text) {
  const tokens = text.split(/\s+/).filter(Boolean);
  return tokens.some((token) => {
    const clean = token.replace(/[^a-z]/gi, "").toLowerCase();
    if (clean.length < 7) return false;
    const vowels = (clean.match(/[aeiou]/g) || []).length;
    return vowels === 0 || vowels / clean.length < 0.16;
  });
}

function looksLikeIngredientName(name) {
  const trimmed = (name || "").trim();
  if (!trimmed) return false;
  if (symbolRatio(trimmed) > 0.2) return false;
  if (hasGibberishToken(trimmed)) return false;

  const words = tokenizeAlpha(trimmed).filter((w) => !STOP_WORDS.has(w));
  if (!words.length) return false;

  const hits = words.filter((w) => INGREDIENT_HINT_WORDS.has(w)).length;
  const hitRatio = hits / words.length;
  if (hits >= 1) return true;

  // Fallback acceptance for unknown but clean ingredient names.
  if (words.length <= 4 && hitRatio >= 0.2) return true;
  if (words.length <= 3 && words.every((w) => w.length >= 2 && w.length <= 14)) return true;
  return false;
}

function countAlpha(text) {
  return (text.match(/[A-Za-z]/g) || []).length;
}

function isLikelyIngredientLine(line) {
  const lower = line.toLowerCase();
  const first = lower.split(" ")[0];
  if (BLOCKED_PREFIXES.has(first)) return false;
  if (lower.includes("http://") || lower.includes("https://")) return false;
  if (countAlpha(line) < 2) return false;
  if (symbolRatio(line) > 0.17) return false;
  if (hasGibberishToken(line)) return false;

  const tokens = line.split(/\s+/).filter(Boolean);
  const hasQtyStart = tokens.length > 0 && isQuantityToken(tokens[0]);
  const hasUnitToken = tokens.some((t) => COMMON_UNITS.has(normalizeUnit(t)));

  if (!hasQtyStart && !hasUnitToken) {
    const alphaWords = tokenizeAlpha(line).filter((w) => !STOP_WORDS.has(w));
    if (alphaWords.length < 1 || alphaWords.length > 6) return false;
    if (!looksLikeIngredientName(line)) return false;
  }

  return true;
}

function normalizeUnit(token) {
  return token.toLowerCase().replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, "");
}

function normalizeQuantityToken(token) {
  let t = token.toLowerCase().replace(/^[^a-z0-9./-]+|[^a-z0-9./-]+$/g, "");
  if (!t) return "";
  t = t.replace(/[|il](?=\/\d)/g, "1");
  t = t.replace(/^o(?=\d)/g, "0");
  t = t.replace(/(\d)-(\d+\/\d+)/g, "$1-$2");
  return t;
}

function isQuantityToken(token) {
  const t = normalizeQuantityToken(token);
  if (!t) return false;
  if (/^\d+$/.test(t)) return true;
  if (/^\d+\.\d+$/.test(t)) return true;
  if (/^\d+\/\d+$/.test(t)) return true;
  if (/^\d+-\d+$/.test(t)) return true;
  if (/^\d+-\d+\/\d+$/.test(t)) return true;
  return false;
}

function parseIngredientLine(line, confidence) {
  const tokens = line.split(" ").filter(Boolean);
  if (!tokens.length) return null;

  const quantityParts = [];
  while (tokens.length && isQuantityToken(tokens[0]) && quantityParts.length < 2) {
    quantityParts.push(normalizeQuantityToken(tokens.shift()));
  }

  let unit = null;
  if (tokens.length) {
    const candidateUnit = normalizeUnit(tokens[0]);
    if (COMMON_UNITS.has(candidateUnit)) {
      unit = candidateUnit;
      tokens.shift();
    }
  }

  let name = tokens.join(" ").trim();
  name = name.replace(/^[,.:;\-]+|[,.:;\-]+$/g, "").trim();
  if (!name && quantityParts.length === 0) return null;
  if (!name && quantityParts.length > 0) return null;

  const hasQtyOrUnit = quantityParts.length > 0 || !!unit;
  if (!looksLikeIngredientName(name)) {
    if (!hasQtyOrUnit) return null;
    if (symbolRatio(name) > 0.14 || hasGibberishToken(name)) return null;
  }

  let score = confidence;
  if (quantityParts.length) score += 0.08;
  if (unit) score += 0.08;
  if ((name || line).length < 3) score -= 0.15;
  score = Math.max(0, Math.min(1, score));

  return {
    id: uid(),
    name: name || line,
    quantity: quantityParts.length ? quantityParts.join(" ") : "",
    unit: unit || "",
    confidence: score,
    rawLine: line,
  };
}

function parseIngredients(rawText, confidence) {
  const lines = rawText
    .split(/\r?\n/)
    .map(normalizeText)
    .filter(Boolean);

  const ingredients = [];
  const dropped = [];

  for (const line of lines) {
    if (!isLikelyIngredientLine(line)) {
      dropped.push(line);
      continue;
    }
    const parsed = parseIngredientLine(line, confidence);
    if (parsed) ingredients.push(parsed);
    else dropped.push(line);
  }

  const ingredientCount = ingredients.length;
  const totalLines = lines.length;
  const droppedCount = dropped.length;
  const quantityCount = ingredients.filter((x) => (x.quantity || "").trim()).length;
  const unitCount = ingredients.filter((x) => (x.unit || "").trim()).length;
  const avgConfidence = ingredientCount
    ? ingredients.reduce((sum, item) => sum + (item.confidence || 0), 0) / ingredientCount
    : confidence || 0;
  const parseYield = totalLines ? ingredientCount / totalLines : 0;
  const quantityCoverage = ingredientCount ? quantityCount / ingredientCount : 0;
  const unitCoverage = ingredientCount ? unitCount / ingredientCount : 0;
  const qualityScore = Math.max(
    0,
    Math.min(
      1,
      avgConfidence * 0.5 + parseYield * 0.3 + quantityCoverage * 0.1 + unitCoverage * 0.1
    )
  );

  return {
    ingredients,
    droppedLines: dropped,
    metrics: {
      totalLines,
      ingredientCount,
      droppedCount,
      quantityCount,
      unitCount,
      parseYield,
      quantityCoverage,
      unitCoverage,
      avgConfidence,
      qualityScore,
    },
  };
}

function deriveRecipeName(rawText) {
  const lines = rawText
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter(Boolean);
  if (!lines.length) return "Untitled Recipe";
  const first = lines[0];
  if (first.length > 40 && lines[1]) return lines[1].slice(0, 40);
  return first.slice(0, 40);
}

async function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function preprocessImageDataUrl(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const baseW = image.naturalWidth || image.width;
      const baseH = image.naturalHeight || image.height;
      const scale = Math.min(2.1, 2200 / Math.max(baseW, baseH));
      const width = Math.max(1, Math.round(baseW * scale));
      const height = Math.max(1, Math.round(baseH * scale));

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) {
        reject(new Error("Canvas context unavailable."));
        return;
      }

      ctx.drawImage(image, 0, 0, width, height);
      const frame = ctx.getImageData(0, 0, width, height);
      const data = frame.data;

      // Grayscale + adaptive contrast style boost for text readability.
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        let gray = r * 0.299 + g * 0.587 + b * 0.114;
        gray = (gray - 128) * 1.42 + 128;
        gray = Math.max(0, Math.min(255, gray));
        const bw = gray > 150 ? 255 : gray < 85 ? 0 : gray;
        data[i] = bw;
        data[i + 1] = bw;
        data[i + 2] = bw;
      }

      ctx.putImageData(frame, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    image.onerror = () => reject(new Error("Failed to preprocess image."));
    image.src = dataUrl;
  });
}

async function runTesseractPass(imageSource, sourceLabel, pageSegMode) {
  const result = await window.Tesseract.recognize(imageSource, "eng", {
    logger: (msg) => {
      if (msg && msg.status === "recognizing text") {
        dom.extractProgress.textContent = `${sourceLabel} ${Math.round((msg.progress || 0) * 100)}%`;
      }
    },
    tessedit_pageseg_mode: String(pageSegMode),
    preserve_interword_spaces: "1",
    tessedit_char_whitelist:
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/.,:-() %'",
  });

  const rawText = (result?.data?.text || "").trim();
  const confidence = Number.isFinite(result?.data?.confidence)
    ? Math.max(0, Math.min(1, result.data.confidence / 100))
    : 0.6;
  return { rawText, confidence, source: sourceLabel };
}

function scoreOCRCandidate(candidate) {
  const parsed = parseIngredients(candidate.rawText, candidate.confidence || 0.6);
  const metrics = parsed.metrics;
  const score =
    metrics.ingredientCount * 1.8 +
    metrics.parseYield * 10 +
    metrics.quantityCoverage * 5 +
    metrics.unitCoverage * 3 +
    metrics.avgConfidence * 6 -
    metrics.droppedCount * 0.5;

  return {
    ...candidate,
    parsed,
    score,
  };
}

async function runOCR() {
  const manualText = dom.ocrInput.value.trim();
  if (manualText) {
    const parsed = parseIngredients(manualText, 0.95);
    return {
      rawText: manualText,
      confidence: 0.95,
      source: "manual override",
      parsed,
      candidates: [
        {
          source: "manual override",
          confidence: 0.95,
          score: parsed.metrics.qualityScore * 100,
        },
      ],
    };
  }

  if (!state.scan.selectedImageDataUrl) {
    throw new Error("Import an image or paste OCR text first.");
  }

  if (window.Tesseract && typeof window.Tesseract.recognize === "function") {
    const preprocessed = await preprocessImageDataUrl(state.scan.selectedImageDataUrl);
    const rawPass = await runTesseractPass(state.scan.selectedImageDataUrl, "OCR(raw psm6)", 6);
    const prepPass = await runTesseractPass(preprocessed, "OCR(preprocessed psm6)", 6);
    const prepDensePass = await runTesseractPass(preprocessed, "OCR(preprocessed psm4)", 4);
    const prepSparsePass = await runTesseractPass(preprocessed, "OCR(preprocessed psm11)", 11);
    const candidates = [rawPass, prepPass, prepDensePass, prepSparsePass].filter(
      (x) => (x.rawText || "").trim().length > 0
    );

    if (!candidates.length) {
      throw new Error("No text detected from OCR.");
    }

    const ranked = candidates.map(scoreOCRCandidate).sort((a, b) => b.score - a.score);
    const best = ranked[0];
    return {
      rawText: best.rawText,
      confidence: best.confidence,
      source: best.source,
      parsed: best.parsed,
      candidates: ranked.map((x) => ({
        source: x.source,
        confidence: Number(x.confidence.toFixed(2)),
        quality: Number(x.parsed.metrics.qualityScore.toFixed(2)),
      })),
    };
  }

  const parsedFallback = parseIngredients(SAMPLE_OCR_TEXT, 0.62);
  return {
    rawText: SAMPLE_OCR_TEXT,
    confidence: 0.62,
    source: "sample fallback",
    parsed: parsedFallback,
    candidates: [
      {
        source: "sample fallback",
        confidence: 0.62,
        quality: Number(parsedFallback.metrics.qualityScore.toFixed(2)),
      },
    ],
  };
}

function confidenceClass(value) {
  if (value >= 0.8) return "confidence-high";
  if (value >= 0.5) return "confidence-mid";
  return "confidence-low";
}

function parseAmount(value) {
  const v = String(value || "").trim();
  if (!v) return null;
  if (/^\d+(\.\d+)?$/.test(v)) return Number(v);
  if (/^\d+-\d+\/\d+$/.test(v)) {
    const [whole, frac] = v.split("-");
    const [n, d] = frac.split("/").map(Number);
    if (!d) return null;
    return Number(whole) + n / d;
  }
  if (/^\d+\/\d+$/.test(v)) {
    const [n, d] = v.split("/").map(Number);
    if (!d) return null;
    return n / d;
  }
  if (/^\d+\s+\d+\/\d+$/.test(v)) {
    const [whole, frac] = v.split(/\s+/);
    const [n, d] = frac.split("/").map(Number);
    if (!d) return null;
    return Number(whole) + n / d;
  }
  return null;
}

function formatAmount(value) {
  if (!Number.isFinite(value)) return null;
  if (Math.round(value) === value) return String(Math.round(value));
  return value.toFixed(2).replace(/\.?0+$/, "");
}

function combineQuantities(first, second) {
  if (!first && !second) return "";
  if (!first) return second;
  if (!second) return first;
  const a = parseAmount(first);
  const b = parseAmount(second);
  if (a === null || b === null) return `${first} + ${second}`;
  return formatAmount(a + b);
}

function generateShoppingListFromRecipe(recipe) {
  return {
    id: uid(),
    createdAt: new Date().toISOString(),
    items: recipe.ingredients
      .filter((item) => item.name.trim())
      .map((item) => ({
        id: uid(),
        name: item.name.trim(),
        quantity: (item.quantity || "").trim(),
        unit: (item.unit || "").trim(),
        isChecked: false,
        sourceRecipeIds: [recipe.id],
      })),
  };
}

function mergeShoppingListFromRecipes(recipes) {
  const index = new Map();
  recipes.forEach((recipe) => {
    recipe.ingredients.forEach((ingredient) => {
      if (!ingredient.name || !ingredient.name.trim()) return;
      const key = `${ingredient.name.trim().toLowerCase()}|${(ingredient.unit || "").trim().toLowerCase()}`;
      const existing = index.get(key);
      if (!existing) {
        index.set(key, {
          id: uid(),
          name: ingredient.name.trim(),
          quantity: (ingredient.quantity || "").trim(),
          unit: (ingredient.unit || "").trim(),
          isChecked: false,
          sourceRecipeIds: [recipe.id],
        });
      } else {
        existing.quantity = combineQuantities(existing.quantity, (ingredient.quantity || "").trim());
        if (!existing.sourceRecipeIds.includes(recipe.id)) {
          existing.sourceRecipeIds.push(recipe.id);
        }
      }
    });
  });

  return {
    id: uid(),
    createdAt: new Date().toISOString(),
    items: Array.from(index.values()).sort((a, b) => a.name.localeCompare(b.name)),
  };
}

function setScanPreview() {
  if (!state.scan.selectedImageDataUrl) {
    dom.imagePreview.innerHTML = "<span>No image loaded</span>";
    dom.selectedImageName.textContent = "No file selected";
    return;
  }
  dom.imagePreview.innerHTML = `<img src="${escapeHtml(state.scan.selectedImageDataUrl)}" alt="Selected recipe image">`;
  dom.selectedImageName.textContent = state.scan.selectedImageName || "Imported image";
}

function renderDraft() {
  const draft = state.draft;
  if (!draft) {
    dom.editorCard.classList.add("hidden");
    dom.ingredientRows.innerHTML = "";
    dom.recipeNameInput.value = "";
    dom.droppedLinesList.innerHTML = "";
    dom.draftHint.textContent = "";
    return;
  }

  dom.editorCard.classList.remove("hidden");
  dom.recipeNameInput.value = draft.recipeName || "";
  const metrics = draft.metrics;
  if (metrics) {
    dom.draftHint.textContent = `${metrics.ingredientCount} parsed | ${Math.round(
      metrics.quantityCoverage * 100
    )}% qty coverage | ${Math.round(metrics.unitCoverage * 100)}% unit coverage`;
  } else {
    dom.draftHint.textContent = `${draft.ingredients.length} ingredients extracted`;
  }

  dom.ingredientRows.innerHTML = draft.ingredients
    .map(
      (item, index) => `
      <div class="ingredient-row">
        <input type="text" data-row="${index}" data-field="quantity" value="${escapeHtml(item.quantity || "")}">
        <input type="text" data-row="${index}" data-field="unit" value="${escapeHtml(item.unit || "")}">
        <input type="text" data-row="${index}" data-field="name" value="${escapeHtml(item.name || "")}">
        <span class="confidence-badge ${confidenceClass(item.confidence)}">${Math.round((item.confidence || 0) * 100)}%</span>
        <button class="ghost danger" data-action="delete-ingredient" data-row="${index}">X</button>
      </div>
    `
    )
    .join("");

  dom.droppedLinesList.innerHTML = draft.droppedLines.length
    ? draft.droppedLines.map((line) => `<li>${escapeHtml(line)}</li>`).join("")
    : "<li>None</li>";
  dom.droppedLinesBox.open = draft.droppedLines.length > 0;
}

function renderRecipes() {
  if (!state.recipes.length) {
    dom.recipesList.innerHTML =
      '<div class="empty">No saved recipes yet. Extract a recipe from the Scan tab.</div>';
    return;
  }

  dom.recipesList.innerHTML = state.recipes
    .map((recipe) => {
      const ingredientChips = recipe.ingredients
        .slice(0, 8)
        .map((item) => {
          const quantity = [item.quantity, item.unit].filter(Boolean).join(" ").trim();
          return `<span class="chip">${escapeHtml(
            quantity ? `${quantity} ${item.name}` : item.name
          )}</span>`;
        })
        .join("");

      return `
      <article class="item-card" data-recipe-id="${recipe.id}">
        <div class="item-head">
          <div>
            <h4>${escapeHtml(recipe.name)}</h4>
            <div class="item-meta">${formatDate(recipe.createdAt)} | ${recipe.ingredients.length} ingredients</div>
          </div>
        </div>
        <div class="ingredient-chip-wrap">${ingredientChips || '<span class="chip">No ingredients</span>'}</div>
        <div class="item-actions">
          <button class="ghost" data-action="generate-list" data-recipe-id="${recipe.id}">Generate Shopping List</button>
          <button class="ghost danger" data-action="delete-recipe" data-recipe-id="${recipe.id}">Delete</button>
        </div>
      </article>`;
    })
    .join("");
}

function renderShopping() {
  const list = state.activeShoppingList;
  if (!list || !list.items.length) {
    dom.shoppingList.innerHTML =
      '<div class="empty">No active shopping list. Save a recipe or merge recipes from the Recipes tab.</div>';
    return;
  }

  dom.shoppingList.innerHTML = list.items
    .map((item) => {
      const quantity = [item.quantity, item.unit].filter(Boolean).join(" ").trim();
      return `
      <div class="shopping-row" data-item-id="${item.id}">
        <input type="checkbox" data-action="toggle-shopping" data-item-id="${item.id}" ${
          item.isChecked ? "checked" : ""
        }>
        <label>
          <span class="shopping-name ${item.isChecked ? "checked" : ""}">${escapeHtml(item.name)}</span>
          <span class="shopping-meta">${escapeHtml(quantity || "Quantity not specified")} | sources: ${
        item.sourceRecipeIds.length
      }</span>
        </label>
      </div>`;
    })
    .join("");
}

function renderSettings() {
  dom.cloudFallbackToggle.checked = !!state.settings.useCloudFallback;
  dom.thresholdInput.value = String(state.settings.lowConfidenceThreshold ?? 0.7);
  dom.thresholdValue.textContent = Number(state.settings.lowConfidenceThreshold ?? 0.7).toFixed(2);
  const tailLogs = state.logs.slice(-20);
  dom.logsPreview.textContent = tailLogs.length
    ? tailLogs.map((entry) => JSON.stringify(entry)).join("\n")
    : "No logs yet.";
}

function renderScanMeta() {
  const conf = state.scan.lastOCRConfidence;
  dom.ocrConfidenceDisplay.textContent = Number.isFinite(conf)
    ? `${Math.round(conf * 100)}%`
    : "-";
  dom.ocrSourceDisplay.textContent = state.scan.lastOCRSource || "-";
}

function renderScanMetrics() {
  const metrics = state.scan.lastMetrics;
  if (!metrics) {
    dom.metricTotalLines.textContent = "-";
    dom.metricParsedLines.textContent = "-";
    dom.metricDroppedLines.textContent = "-";
    dom.metricQtyCoverage.textContent = "-";
    dom.metricUnitCoverage.textContent = "-";
    dom.metricQualityScore.textContent = "-";
    return;
  }

  dom.metricTotalLines.textContent = String(metrics.totalLines);
  dom.metricParsedLines.textContent = String(metrics.ingredientCount);
  dom.metricDroppedLines.textContent = String(metrics.droppedCount);
  dom.metricQtyCoverage.textContent = `${Math.round(metrics.quantityCoverage * 100)}%`;
  dom.metricUnitCoverage.textContent = `${Math.round(metrics.unitCoverage * 100)}%`;
  dom.metricQualityScore.textContent = `${Math.round(metrics.qualityScore * 100)}%`;

  const quality = metrics.qualityScore || 0;
  if (quality >= 0.8) {
    dom.metricQualityScore.style.color = "#7bf3cd";
  } else if (quality >= 0.55) {
    dom.metricQualityScore.style.color = "#ffd184";
  } else {
    dom.metricQualityScore.style.color = "#ffaaaa";
  }
}

function renderStats() {
  const list = state.activeShoppingList;
  const itemCount = list?.items?.length || 0;
  const checkedCount = list?.items?.filter((item) => item.isChecked).length || 0;
  dom.statRecipes.textContent = String(state.recipes.length);
  dom.statShopping.textContent = String(itemCount);
  dom.statChecked.textContent = String(checkedCount);
  const conf = state.scan.lastOCRConfidence;
  dom.statConfidence.textContent = Number.isFinite(conf) ? `${Math.round(conf * 100)}%` : "-";
}

function renderAll() {
  showView(state.ui.activeView || "scan-view");
  setSession(state.ui.sessionText || "Ready", state.ui.sessionTone || "ready");
  setScanPreview();
  renderScanMeta();
  renderScanMetrics();
  renderDraft();
  renderRecipes();
  renderShopping();
  renderSettings();
  renderStats();
}

async function onImageSelected() {
  const file = dom.imageInput.files?.[0];
  if (!file) return;
  try {
    const dataUrl = await readFileAsDataUrl(file);
    state.scan.selectedImageDataUrl = dataUrl;
    state.scan.selectedImageName = file.name;
    state.scan.lastOCRConfidence = null;
    state.scan.lastOCRSource = null;
    state.scan.lastMetrics = null;
    logEvent("info", "image_selected", { name: file.name });
    saveState();
    renderAll();
    setMessage("Image loaded.", "success");
  } catch (error) {
    setMessage(`Failed to load image: ${error.message}`, "error");
  }
}

function clearImage() {
  state.scan.selectedImageDataUrl = null;
  state.scan.selectedImageName = "";
  state.scan.lastOCRConfidence = null;
  state.scan.lastOCRSource = null;
  state.scan.lastMetrics = null;
  dom.imageInput.value = "";
  saveState();
  renderAll();
  setMessage("Image cleared.");
}

async function extractIngredients() {
  setSession("Extracting...", "busy");
  dom.extractProgress.textContent = "";
  setMessage("");
  dom.extractBtn.disabled = true;
  logEvent("info", "ocr_started");

  try {
    const ocr = await runOCR();
    const parsed = ocr.parsed || parseIngredients(ocr.rawText, ocr.confidence || 0.7);
    if (!parsed.ingredients.length) {
      throw new Error("No ingredient lines found. Try a clearer image or paste OCR text manually.");
    }

    state.scan.lastOCRConfidence = ocr.confidence;
    state.scan.lastOCRSource = ocr.source;
    state.scan.lastMetrics = parsed.metrics;
    state.draft = {
      recipeName: deriveRecipeName(ocr.rawText),
      ingredients: parsed.ingredients,
      droppedLines: parsed.droppedLines,
      rawText: ocr.rawText,
      ocrConfidence: ocr.confidence,
      source: ocr.source,
      metrics: parsed.metrics,
      imageDataUrl: state.scan.selectedImageDataUrl,
    };

    if (
      Number.isFinite(ocr.confidence) &&
      ocr.confidence < Number(state.settings.lowConfidenceThreshold || 0.7)
    ) {
      const cloudNote = state.settings.useCloudFallback
        ? " Cloud fallback is toggled on but not implemented in desktop demo."
        : "";
      setMessage(
        `Low OCR confidence (${Math.round(ocr.confidence * 100)}%). Parsed ${
          parsed.metrics.ingredientCount
        }/${parsed.metrics.totalLines} lines.${cloudNote}`,
        "warning"
      );
      logEvent("warning", "ocr_low_confidence", {
        confidence: String(ocr.confidence.toFixed(2)),
      });
      setSession("Low confidence", "warning");
    } else {
      setMessage(
        `Extraction complete. Parsed ${parsed.metrics.ingredientCount}/${parsed.metrics.totalLines} lines (${Math.round(
          parsed.metrics.qualityScore * 100
        )}% quality).`,
        "success"
      );
      setSession("Extraction complete", "success");
    }

    logEvent("info", "ocr_completed", {
      ingredient_count: String(parsed.ingredients.length),
      source: ocr.source,
      quality_score: String(parsed.metrics.qualityScore.toFixed(2)),
      candidates: JSON.stringify(ocr.candidates || []),
    });
    saveState();
    renderAll();
  } catch (error) {
    setMessage(error.message || "Extraction failed.", "error");
    setSession("Extraction failed", "error");
    logEvent("error", "ocr_failed", { error: String(error.message || error) });
  } finally {
    dom.extractBtn.disabled = false;
    dom.extractProgress.textContent = "";
    saveState();
    renderSettings();
  }
}

function addIngredientToDraft() {
  if (!state.draft) return;
  state.draft.ingredients.push({
    id: uid(),
    name: "",
    quantity: "",
    unit: "",
    confidence: 0.5,
    rawLine: "",
  });
  saveState();
  renderDraft();
}

function removeIngredientFromDraft(index) {
  if (!state.draft) return;
  state.draft.ingredients.splice(index, 1);
  saveState();
  renderDraft();
}

function saveDraftToRecipe() {
  if (!state.draft) return;
  const recipeName = dom.recipeNameInput.value.trim() || "Untitled Recipe";
  const ingredients = state.draft.ingredients
    .map((item) => ({
      ...item,
      name: (item.name || "").trim(),
      quantity: (item.quantity || "").trim(),
      unit: (item.unit || "").trim(),
    }))
    .filter((item) => item.name);

  if (!ingredients.length) {
    dom.draftHint.textContent = "Add at least one ingredient before saving.";
    return;
  }

  const recipe = {
    id: uid(),
    name: recipeName,
    createdAt: new Date().toISOString(),
    imageDataUrl: state.draft.imageDataUrl || null,
    ingredients,
  };

  state.recipes.unshift(recipe);
  if (state.recipes.length > 50) {
    state.recipes = state.recipes.slice(0, 50);
  }
  state.activeShoppingList = generateShoppingListFromRecipe(recipe);
  state.draft = null;
  state.scan.selectedImageDataUrl = null;
  state.scan.selectedImageName = "";
  dom.imageInput.value = "";
  dom.ocrInput.value = "";

  logEvent("info", "recipe_saved", {
    recipe_id: recipe.id,
    ingredient_count: String(recipe.ingredients.length),
  });
  setSession("Recipe saved", "success");
  setMessage("Recipe saved and shopping list generated.", "success");
  showView("shopping-view");
  saveState();
  renderAll();
}

function discardDraft() {
  state.draft = null;
  saveState();
  renderAll();
  setSession("Draft discarded", "warning");
}

function generateListFromRecipe(recipeId) {
  const recipe = state.recipes.find((item) => item.id === recipeId);
  if (!recipe) return;
  state.activeShoppingList = generateShoppingListFromRecipe(recipe);
  logEvent("info", "shopping_list_regenerated", { recipe_id: recipeId });
  setSession("Shopping list generated", "success");
  showView("shopping-view");
  saveState();
  renderAll();
}

function deleteRecipe(recipeId) {
  state.recipes = state.recipes.filter((item) => item.id !== recipeId);
  logEvent("warning", "recipe_deleted", { recipe_id: recipeId });
  saveState();
  renderAll();
}

function mergeAllRecipes() {
  if (state.recipes.length < 2) {
    setSession("Need at least 2 recipes", "warning");
    return;
  }
  state.activeShoppingList = mergeShoppingListFromRecipes(state.recipes);
  logEvent("info", "shopping_list_merged", { recipe_count: String(state.recipes.length) });
  setSession("Merged shopping list ready", "success");
  showView("shopping-view");
  saveState();
  renderAll();
}

function toggleShoppingItem(itemId, isChecked) {
  const list = state.activeShoppingList;
  if (!list) return;
  const item = list.items.find((x) => x.id === itemId);
  if (!item) return;
  item.isChecked = !!isChecked;
  saveState();
  renderStats();
  renderShopping();
}

function clearShoppingList() {
  state.activeShoppingList = null;
  logEvent("warning", "shopping_list_cleared");
  saveState();
  renderAll();
}

async function copyLogs() {
  const payload = state.logs.map((line) => JSON.stringify(line)).join("\n");
  try {
    await navigator.clipboard.writeText(payload || "No logs.");
    setSession("Logs copied", "success");
  } catch {
    setSession("Clipboard blocked", "warning");
  }
}

function resetDemoData() {
  const ok = window.confirm("Reset all recipes, shopping lists, settings, and logs?");
  if (!ok) return;
  state = makeDefaultState();
  saveState();
  renderAll();
  setSession("Demo reset", "warning");
}

function bindEvents() {
  dom.navButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      showView(btn.dataset.viewTarget);
      renderAll();
    });
  });

  dom.imageInput.addEventListener("change", onImageSelected);
  dom.clearImageBtn.addEventListener("click", clearImage);
  dom.extractBtn.addEventListener("click", extractIngredients);

  dom.recipeNameInput.addEventListener("input", () => {
    if (!state.draft) return;
    state.draft.recipeName = dom.recipeNameInput.value;
    saveState();
  });

  dom.ingredientRows.addEventListener("input", (event) => {
    if (!state.draft) return;
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    const row = Number(target.dataset.row);
    const field = target.dataset.field;
    if (!Number.isFinite(row) || !field || !state.draft.ingredients[row]) return;
    state.draft.ingredients[row][field] = target.value;
    saveState();
  });

  dom.ingredientRows.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.dataset.action !== "delete-ingredient") return;
    const row = Number(target.dataset.row);
    if (Number.isFinite(row)) removeIngredientFromDraft(row);
  });

  dom.addIngredientBtn.addEventListener("click", addIngredientToDraft);
  dom.saveDraftBtn.addEventListener("click", saveDraftToRecipe);
  dom.discardDraftBtn.addEventListener("click", discardDraft);

  dom.recipesList.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const action = target.dataset.action;
    const recipeId = target.dataset.recipeId;
    if (!action || !recipeId) return;
    if (action === "generate-list") generateListFromRecipe(recipeId);
    if (action === "delete-recipe") deleteRecipe(recipeId);
  });

  dom.mergeAllBtn.addEventListener("click", mergeAllRecipes);

  dom.shoppingList.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    if (target.dataset.action !== "toggle-shopping") return;
    toggleShoppingItem(target.dataset.itemId, target.checked);
  });

  dom.clearShoppingBtn.addEventListener("click", clearShoppingList);

  dom.cloudFallbackToggle.addEventListener("change", () => {
    state.settings.useCloudFallback = dom.cloudFallbackToggle.checked;
    saveState();
    renderSettings();
  });

  dom.thresholdInput.addEventListener("input", () => {
    state.settings.lowConfidenceThreshold = Number(dom.thresholdInput.value);
    saveState();
    renderSettings();
  });

  dom.copyLogsBtn.addEventListener("click", copyLogs);
  dom.resetDemoBtn.addEventListener("click", resetDemoData);
}

function init() {
  bindEvents();
  renderAll();
  logEvent("info", "desktop_demo_loaded");
  saveState();
}

init();
