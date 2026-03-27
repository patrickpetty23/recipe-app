// ──────────────────────────────────────────────
// INGREDIENT PARSER (extracted from app.js)
// ──────────────────────────────────────────────

import {
  COMMON_UNITS, BLOCKED_PREFIXES, SECTION_END_PREFIXES,
  INSTRUCTION_HINT_WORDS, STOP_WORDS, INGREDIENT_HINT_WORDS,
  FRACTION_MAP,
} from "./constants.js";

// These utility functions are imported from the main app module.
// They will be provided via setParserDeps() before any parser function is called.
let _uid = null;
let _trimToNull = null;
let _clamp = null;

export function setParserDeps({ uid, trimToNull, clamp }) {
  _uid = uid;
  _trimToNull = trimToNull;
  _clamp = clamp;
}

// ──────────────────────────────────────────────
// INGREDIENT PARSER (port from RecipeCore)
// ──────────────────────────────────────────────

export function tokenizeAlpha(text) {
  return (
    String(text)
      .toLowerCase()
      .match(/[a-z]+/g) || []
  ).filter(Boolean);
}

export function symbolRatio(text) {
  if (!text.length) return 1;
  return (text.match(/[^a-zA-Z0-9\s./,()\-]/g) || []).length / text.length;
}

export function hasGibberishToken(text) {
  return String(text)
    .split(/\s+/)
    .some((tok) => {
      const c = tok.replace(/[^a-z]/gi, "").toLowerCase();
      if (c.length < 7) return false;
      const v = (c.match(/[aeiou]/g) || []).length;
      return v === 0 || v / c.length < 0.16;
    });
}

export function countLetters(text) {
  return (String(text).match(/[A-Za-z]/g) || []).length;
}

export function splitFusedMeasurementTokens(line) {
  const u =
    "(tablespoons?|tbsp|teaspoons?|tsp|ounces?|oz|pounds?|lbs?|lb|grams?|gram|g|kg|ml|l|cloves?|clove|cans?|can|packages?|package|pkg|pinch|dash|cups?|cup)";
  return line
    .replace(
      new RegExp(`(\\d[\\d./-]*)(?:\\s*)(${u})(?=[a-z])`, "gi"),
      "$1 $2 ",
    )
    .replace(new RegExp(`\\b(${u})([a-z]{3,})\\b`, "gi"), "$1 $2")
    .replace(/(\d)([a-zA-Z])/g, "$1 $2")
    .replace(/([a-zA-Z])(\d)/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeText(text) {
  let v = String(text || "").trim();
  v = v
    .replace(
      /(\d)([\u00bc\u00bd\u00be\u2153\u2154\u215b\u215c\u215d\u215e])/g,
      "$1 $2",
    )
    .replace(
      /([\u00bc\u00bd\u00be\u2153\u2154\u215b\u215c\u215d\u215e])(\d)/g,
      "$1 $2",
    );
  Object.entries(FRACTION_MAP).forEach(([from, to]) => {
    v = v.replaceAll(from, to);
  });
  v = v
    .replaceAll("\u2022", " ")
    .replaceAll("\u2014", " ")
    .replaceAll("\u2018", "'")
    .replaceAll("\u2019", "'")
    .replaceAll("\u201c", '"')
    .replaceAll("\u201d", '"')
    .replaceAll("\t", " ")
    .replace(/\s+/g, " ")
    .trim();
  v = v
    .replace(/\b[I|l](?=\/\d)/g, "1")
    .replace(/\bO(?=\d)/g, "0")
    .replace(/(\d)\s*-\s*(\d+\/\d+)/g, "$1-$2")
    .replace(/^\W+/, "")
    .trim();
  return splitFusedMeasurementTokens(v);
}

export function normalizeUnitToken(tok) {
  return String(tok || "")
    .toLowerCase()
    .replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, "");
}

export function normalizeQuantityToken(tok) {
  let n = String(tok || "")
    .toLowerCase()
    .replace(/^[^a-z0-9./-]+|[^a-z0-9./-]+$/g, "");
  return n
    .replace(/[|il](?=\/\d)/g, "1")
    .replace(/^o(?=\d)/g, "0")
    .replace(/(\d)-(\d+\/\d+)/g, "$1-$2");
}

export function normalizeUnitValue(tok) {
  const n = normalizeUnitToken(tok);
  if (!n) return null;
  const map = {
    tablespoon: "tbsp",
    tablespoons: "tbsp",
    teaspoon: "tsp",
    teaspoons: "tsp",
    ounce: "oz",
    ounces: "oz",
    pound: "lb",
    pounds: "lb",
    lbs: "lb",
    grams: "g",
    cloves: "clove",
    cans: "can",
    packages: "package",
    cups: "cup",
  };
  return map[n] || n;
}

export function isQuantityToken(tok) {
  const n = normalizeQuantityToken(tok);
  if (!n) return false;
  return /^\d+$|^\d+\.\d+$|^\d+\/\d+$|^\d+-\d+$|^\d+-\d+\/\d+$/.test(n);
}

export function startsIngredientSection(line) {
  return (
    /^\s*ingredients?\s*[:\-]?\s*$/i.test(line) ||
    /^\s*ingredients?\s*:/i.test(line)
  );
}

export function endsIngredientSection(line) {
  const first =
    String(line || "")
      .toLowerCase()
      .trim()
      .split(/\s+/)[0] || "";
  return SECTION_END_PREFIXES.has(first);
}

export function hasUnitTokenAnywhere(tokens) {
  return tokens.some((t) => COMMON_UNITS.has(normalizeUnitToken(t)));
}

export function hasInstructionVerb(line) {
  for (const w of INSTRUCTION_HINT_WORDS) {
    if (line.includes(w)) return true;
  }
  return false;
}

export function analyzeIngredientName(name) {
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
  return {
    trimmed,
    words,
    hintHits,
    longWordCount,
    singleCharWords,
    letters,
    digits,
    nonSpaceLength,
    alphaRatio,
    digitRatio,
    symbol: symbolRatio(trimmed),
    longWordRatio,
  };
}

export function isReadableIngredientName(name) {
  const s = analyzeIngredientName(name);
  if (!s.trimmed || s.letters < 3 || s.alphaRatio < 0.58) return false;
  if (s.digitRatio > 0.16 || s.digits > 1 || s.symbol > 0.12) return false;
  if (s.words.length < 1 || s.words.length > 6 || s.longWordCount < 1)
    return false;
  if (s.hintHits === 0 && s.longWordRatio < 0.4) return false;
  if (s.singleCharWords > 0 && s.words.length > 1 && s.hintHits === 0)
    return false;
  if (hasGibberishToken(s.trimmed)) return false;
  return true;
}

export function ingredientNameQuality(name) {
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
  return _clamp(score);
}

export function looksLikeIngredientName(name) {
  if (!isReadableIngredientName(name)) return false;
  const s = analyzeIngredientName(name);
  if (s.hintHits >= 1) return true;
  if (s.words.length === 1) return s.words[0].length >= 4;
  if (
    s.words.length <= 4 &&
    s.words.every((w) => w.length >= 2 && w.length <= 14)
  )
    return true;
  if (s.longWordRatio >= 0.6) return true;
  return false;
}

export function isLikelyIngredientLine(line) {
  const lower = line.toLowerCase();
  const first = lower.split(" ")[0];
  if (BLOCKED_PREFIXES.has(first)) return false;
  if (lower.includes("http://") || lower.includes("https://")) return false;
  if (
    countLetters(line) < 2 ||
    symbolRatio(line) > 0.17 ||
    hasGibberishToken(line)
  )
    return false;
  const tokens = line.split(/\s+/).filter(Boolean);
  const hasQty = tokens.length > 0 && isQuantityToken(tokens[0]);
  const hasUnit = hasUnitTokenAnywhere(tokens);
  const nameCandidate = tokens
    .slice(hasQty ? 1 : 0)
    .filter((t) => !COMMON_UNITS.has(normalizeUnitToken(t)))
    .join(" ")
    .trim();
  if (
    (hasQty || hasUnit) &&
    nameCandidate &&
    !isReadableIngredientName(nameCandidate)
  )
    return false;
  if (!hasQty && !hasUnit) {
    const words = tokenizeAlpha(line).filter((w) => !STOP_WORDS.has(w));
    if (words.length < 1 || words.length > 6) return false;
    if (!looksLikeIngredientName(line)) return false;
  }
  return true;
}

export function parseIngredientLine(line, confidence) {
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
    if (nu && COMMON_UNITS.has(nu)) {
      unit = nu;
      tokens.shift();
    }
  }

  if (!qtyParts.length && tokens.length >= 2) {
    const mq = normalizeQuantityToken(tokens[0]);
    const mu = normalizeUnitValue(tokens[1]);
    if (isQuantityToken(mq) && mu && COMMON_UNITS.has(mu)) {
      qtyParts.push(mq);
      unit = mu;
      tokens.shift();
      tokens.shift();
    }
  }

  let name = tokens
    .join(" ")
    .trim()
    .replace(/^[,.:;\-]+|[,.:;\-]+$/g, "")
    .trim();
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

  return {
    id: _uid(),
    name,
    quantity: qtyParts.length ? qtyParts.join(" ") : null,
    unit,
    confidence: _clamp(score),
    rawLine: norm,
  };
}

export function parseIngredientsFromLines(lines) {
  const normalized = lines
    .map((l) => ({
      text: normalizeText(l.text),
      confidence: Number.isFinite(l.confidence) ? l.confidence : 0.6,
    }))
    .filter((l) => l.text);

  let scopedLines = normalized;
  const startIdx = normalized.findIndex((l) => startsIngredientSection(l.text));
  if (startIdx >= 0) {
    const section = normalized.slice(startIdx + 1);
    scopedLines = [];
    for (const entry of section) {
      const low = entry.text.toLowerCase();
      if (
        endsIngredientSection(entry.text) ||
        (/^\s*\d+\s*[\).]/.test(low) && hasInstructionVerb(low))
      )
        break;
      scopedLines.push(entry);
    }
  }

  const ingredients = [],
    droppedLines = [];
  for (const lineObj of scopedLines) {
    if (!lineObj.text) continue;
    if (lineObj.confidence < 0.28) {
      droppedLines.push(lineObj.text);
      continue;
    }
    if (!isLikelyIngredientLine(lineObj.text)) {
      droppedLines.push(lineObj.text);
      continue;
    }
    const parsed = parseIngredientLine(lineObj.text, lineObj.confidence);
    if (!parsed) {
      droppedLines.push(lineObj.text);
      continue;
    }
    const hasQU = !!_trimToNull(parsed.quantity) || !!_trimToNull(parsed.unit);
    const nq = ingredientNameQuality(parsed.name);
    if (nq < (hasQU ? 0.52 : 0.62)) {
      droppedLines.push(lineObj.text);
      continue;
    }
    if (lineObj.confidence < 0.42 && !hasQU) {
      droppedLines.push(lineObj.text);
      continue;
    }
    parsed.confidence = _clamp(parsed.confidence * 0.75 + nq * 0.25);
    ingredients.push(parsed);
  }

  // Dedup
  const seen = new Set(),
    deduped = [];
  for (const ing of ingredients) {
    const key = `${ing.name.toLowerCase()}|${(ing.quantity || "-").toLowerCase()}|${(ing.unit || "-").toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(ing);
  }

  const total = scopedLines.length || normalized.length;
  const ic = deduped.length;
  const qc = deduped.filter((i) => !!_trimToNull(i.quantity)).length;
  const uc = deduped.filter((i) => !!_trimToNull(i.unit)).length;
  const anq = ic
    ? deduped.reduce((s, i) => s + ingredientNameQuality(i.name), 0) / ic
    : 0;
  const ac = ic ? deduped.reduce((s, i) => s + (i.confidence || 0), 0) / ic : 0;
  const py = total ? ic / total : 0;
  const qcov = ic ? qc / ic : 0;
  const ucov = ic ? uc / ic : 0;
  const qs = _clamp(ac * 0.35 + py * 0.2 + qcov * 0.15 + ucov * 0.1 + anq * 0.2);

  return {
    ingredients: deduped,
    droppedLines,
    metrics: {
      totalLines: total,
      ingredientCount: ic,
      droppedCount: droppedLines.length,
      quantityCoverage: qcov,
      unitCoverage: ucov,
      avgNameQuality: anq,
      avgConfidence: ac,
      qualityScore: qs,
    },
  };
}

// ──────────────────────────────────────────────
// OCR ENGINE (Tesseract.js + Cloud Proxy)
// ──────────────────────────────────────────────

async function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () =>
      reject(reader.error || new Error("Failed to read file."));
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
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) {
        reject(new Error("Canvas init failed."));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      const frame = ctx.getImageData(0, 0, w, h);
      const px = frame.data;
      for (let i = 0; i < px.length; i += 4) {
        let gray = px[i] * 0.299 + px[i + 1] * 0.587 + px[i + 2] * 0.114;
        gray = (gray - 128) * 1.42 + 128;
        gray = Math.max(0, Math.min(255, gray));
        const s = gray > 150 ? 255 : gray < 85 ? 0 : gray;
        px[i] = s;
        px[i + 1] = s;
        px[i + 2] = s;
      }
      ctx.putImageData(frame, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () =>
      reject(new Error("Failed to load image for preprocessing."));
    img.src = dataUrl;
  });
}

export function linesFromTesseractData(data) {
  if (Array.isArray(data?.lines) && data.lines.length) {
    return data.lines
      .map((l) => ({
        text: String(l?.text || "").trim(),
        confidence: Number.isFinite(l?.confidence)
          ? _clamp(l.confidence / 100)
          : Number.isFinite(data?.confidence)
            ? _clamp(data.confidence / 100)
            : 0.6,
      }))
      .filter((l) => l.text);
  }
  const fc = Number.isFinite(data?.confidence)
    ? _clamp(data.confidence / 100)
    : 0.6;
  return String(data?.text || "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => ({ text: l, confidence: fc }));
}

export function linesFromCloudPayload(payload) {
  if (Array.isArray(payload?.lines) && payload.lines.length) {
    return payload.lines
      .map((l) => ({
        text: String(l?.text || "").trim(),
        confidence: Number.isFinite(l?.confidence)
          ? _clamp(l.confidence)
          : Number.isFinite(payload?.averageConfidence)
            ? _clamp(payload.averageConfidence)
            : 0.9,
      }))
      .filter((l) => l.text);
  }
  const fc = Number.isFinite(payload?.averageConfidence)
    ? _clamp(payload.averageConfidence)
    : 0.9;
  return String(payload?.rawText || "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
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
      try {
        const p = await resp.json();
        msg = p?.error || p?.message || "";
      } catch {
        msg = await resp.text();
      }
      throw new Error(`Cloud OCR HTTP ${resp.status}${msg ? ` (${msg})` : ""}`);
    }
    const payload = await resp.json();
    if (!payload?.ok)
      throw new Error(payload?.error || "Cloud OCR unsuccessful.");
    const lines = linesFromCloudPayload(payload);
    const rawText = String(
      payload?.rawText || lines.map((l) => l.text).join("\n"),
    ).trim();
    const avgConf = lines.length
      ? lines.reduce((s, l) => s + l.confidence, 0) / lines.length
      : Number.isFinite(payload?.averageConfidence)
        ? _clamp(payload.averageConfidence)
        : 0.88;
    const structuredIngredients = Array.isArray(payload?.ingredients)
      ? payload.ingredients
          .map((i) => ({
            id: _uid(),
            name: String(i?.name || "").trim(),
            quantity: _trimToNull(i?.quantity),
            unit: _trimToNull(i?.unit),
            confidence: Number.isFinite(i?.confidence)
              ? _clamp(i.confidence)
              : avgConf,
            rawLine: i?.rawLine ? String(i.rawLine) : null,
          }))
          .filter((i) => i.name)
      : [];
    return {
      lines,
      rawText,
      averageConfidence: avgConf,
      source: payload?.source || sourceLabel || "cloud OCR",
      ingredients: structuredIngredients,
      droppedLines: Array.isArray(payload?.droppedLines)
        ? payload.droppedLines.map(String)
        : [],
      parseMeta: payload?.parseMeta || null,
      cloudMeta: payload?.meta || null,
    };
  } finally {
    clearTimeout(tid);
  }
}

export function extractionScore(extraction) {
  const parsed = parseIngredientsFromLines(extraction.lines);
  const m = parsed.metrics;
  const lowIng = m.ingredientCount < 2 ? 4 : 0;
  const lowNQ = m.avgNameQuality < 0.55 ? 6 : 0;
  const lowQ = m.qualityScore < 0.45 ? 4 : 0;
  const score =
    m.ingredientCount * 2 +
    m.qualityScore * 12 +
    m.quantityCoverage * 4 +
    m.unitCoverage * 2 +
    m.avgNameQuality * 6 +
    extraction.averageConfidence * 4 -
    m.droppedCount * 0.6 -
    lowIng -
    lowNQ -
    lowQ;
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
    tessedit_char_whitelist:
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/.,:-() %'",
  });
  const lines = linesFromTesseractData(result?.data);
  const rawText = lines.map((l) => l.text).join("\n");
  const avgConf = lines.length
    ? lines.reduce((s, l) => s + l.confidence, 0) / lines.length
    : Number.isFinite(result?.data?.confidence)
      ? _clamp(result.data.confidence / 100)
      : 0;
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
      const pass1 = await runCloudProxyPass(
        imageDataUrl,
        "cloud OCR (OCR.Space)",
      );
      if (pass1.lines.length) candidates.push(pass1);
    } catch (e) {
      cloudWarning = e.message || String(e);
    }

    state.ui.extractProgress = "Cloud OCR: enhanced pass…";
    renderScanStatus();
    try {
      const pass2 = await runCloudProxyPass(
        preprocessed,
        "cloud OCR (OCR.Space preprocessed)",
      );
      if (pass2.lines.length) candidates.push(pass2);
    } catch (e) {
      if (!cloudWarning) cloudWarning = e.message || String(e);
    }

    if (candidates.length) {
      const ranked = candidates
        .map(extractionScore)
        .sort((a, b) => b.score - a.score);
      const best = ranked[0];
      const bm = best?.parseResult?.metrics || {};
      if ((bm.qualityScore || 0) >= 0.62 && (bm.ingredientCount || 0) >= 2) {
        if (cloudWarning)
          best.fallbackNote = `Cloud OCR partially degraded: ${cloudWarning}`;
        return best;
      }
    }
  }

  // Tesseract.js fallback
  if (!window.Tesseract || typeof window.Tesseract.recognize !== "function") {
    if (candidates.length) {
      const ranked = candidates
        .map(extractionScore)
        .sort((a, b) => b.score - a.score);
      const best = ranked[0];
      if (cloudWarning)
        best.fallbackNote = `On-device OCR unavailable. ${cloudWarning}`;
      return best;
    }
    throw new Error(
      "OCR engine not loaded. Start the cloud proxy (python scripts/ocr_proxy_server.py) or wait for Tesseract.js to load.",
    );
  }

  const rawPass = await runTesseractPass(
    imageDataUrl,
    "on-device OCR (psm6)",
    6,
  );
  if (rawPass.lines.length) candidates.push(rawPass);

  const prepPass = await runTesseractPass(
    preprocessed,
    "on-device OCR processed (psm6)",
    6,
  );
  if (prepPass.lines.length) candidates.push(prepPass);

  const densePass = await runTesseractPass(
    preprocessed,
    "on-device OCR processed (psm4)",
    4,
  );
  if (densePass.lines.length) candidates.push(densePass);

  const sparsePass = await runTesseractPass(
    preprocessed,
    "on-device OCR processed (psm11)",
    11,
  );
  if (sparsePass.lines.length) candidates.push(sparsePass);

  if (!candidates.length) {
    throw new Error(
      "No text detected. Try a clearer photo in better lighting.",
    );
  }

  const ranked = candidates
    .map(extractionScore)
    .sort((a, b) => b.score - a.score);
  const best = ranked[0];
  if (cloudWarning)
    best.fallbackNote = `Cloud OCR unavailable, used on-device. ${cloudWarning}`;
  return best;
}

// ──────────────────────────────────────────────
// SHOPPING LIST LOGIC
// ──────────────────────────────────────────────

export function parseAmount(v) {
  const n = String(v || "").trim();
  if (!n) return null;
  if (/^\d+(\.\d+)?$/.test(n)) return Number(n);
  if (/^\d+-\d+\/\d+$/.test(n)) {
    const [w, f] = n.split("-");
    const [num, den] = f.split("/").map(Number);
    return den ? Number(w) + num / den : null;
  }
  if (/^\d+\/\d+$/.test(n)) {
    const [num, den] = n.split("/").map(Number);
    return den ? num / den : null;
  }
  if (/^\d+\s+\d+\/\d+$/.test(n)) {
    const [w, f] = n.split(/\s+/);
    const [num, den] = f.split("/").map(Number);
    return den ? Number(w) + num / den : null;
  }
  return null;
}

export function formatAmount(v) {
  if (!Number.isFinite(v)) return null;
  if (Math.round(v) === v) return String(Math.round(v));
  return v.toFixed(2).replace(/\.?0+$/, "");
}

export function combineQuantities(a, b) {
  const l = _trimToNull(a),
    r = _trimToNull(b);
  if (!l && !r) return null;
  if (!l) return r;
  if (!r) return l;
  const la = parseAmount(l),
    ra = parseAmount(r);
  return la !== null && ra !== null ? formatAmount(la + ra) : `${l} + ${r}`;
}

export function scaleQuantity(quantity, factor) {
  const normalized = _trimToNull(quantity);
  if (!normalized || !Number.isFinite(factor) || factor <= 0) return normalized;
  const parsed = parseAmount(normalized);
  if (parsed === null) return normalized;
  return formatAmount(parsed * factor);
}

export function scaleRecipeIngredients(recipe, factor = 1) {
  return (recipe.ingredients || []).map((ingredient) => ({
    ...ingredient,
    quantity: scaleQuantity(ingredient.quantity, factor),
  }));
}
