/* ──────────────────────────────────────────────
   Recipe Scanner — Utility & Normalization Functions
   Pure functions only — no state references
   ────────────────────────────────────────────── */

import { RECIPE_SOURCE_LABELS, RECIPE_SOURCE_TYPES } from "./constants.js";
import { parseIngredientLine, normalizeUnitValue } from "./parser.js";

// ─── Core Utilities ───

export function uid() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function trimToNull(v) {
  const s = String(v ?? "").trim();
  return s || null;
}

export function escapeHtml(v) {
  return String(v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return String(iso);
  }
}

export function sourceTypeLabel(sourceType) {
  return RECIPE_SOURCE_LABELS[sourceType] || "Imported Recipe";
}

export function normalizeSourceType(sourceType) {
  const value = trimToNull(sourceType);
  return value && RECIPE_SOURCE_TYPES.has(value) ? value : "manual_entry";
}

export function cleanUrl(url) {
  const value = trimToNull(url);
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  return /^www\./i.test(value) ? `https://${value}` : value;
}

export function hostFromUrl(url) {
  try {
    return new URL(url).host.replace(/^www\./i, "");
  } catch {
    return null;
  }
}

export function inferSourceTypeFromUrl(url) {
  const host = String(hostFromUrl(url) || "").toLowerCase();
  if (!host) return "recipe_url";
  if (/(tiktok|pinterest|instagram|youtube|youtu\.be)/.test(host))
    return "social_url";
  return "recipe_url";
}

export function todayIsoDate() {
  try {
    return new Date().toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

export function clamp(v, lo = 0, hi = 1) {
  return Math.max(lo, Math.min(hi, v));
}

// ─── Normalization ───

export function normalizeRecipeTitle(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeIngredientName(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeIngredient(ing) {
  if (!ing || typeof ing !== "object") return null;
  const enriched = enrichIngredientFields({
    id: trimToNull(ing.id) || uid(),
    name: trimToNull(ing.name) || "",
    quantity: trimToNull(ing.quantity),
    unit: trimToNull(ing.unit),
    confidence: Number.isFinite(Number(ing.confidence))
      ? clamp(Number(ing.confidence))
      : 0.7,
    rawLine: trimToNull(ing.rawLine),
  });
  return trimToNull(enriched.name) ? enriched : null;
}

export function normalizeStep(step, index = 0) {
  if (!step || typeof step !== "object") return null;
  const instruction = trimToNull(step.instruction || step.text);
  if (!instruction) return null;
  return {
    step: Number.isFinite(Number(step.step)) ? Number(step.step) : index + 1,
    instruction,
    temperature: trimToNull(step.temperature),
    duration: trimToNull(step.duration),
  };
}

export function inferLegacyRecipeSourceType(recipe) {
  if (recipe?.sourceType && RECIPE_SOURCE_TYPES.has(recipe.sourceType))
    return recipe.sourceType;
  if (Array.isArray(recipe?.steps) && recipe.steps.length && recipe?.meta)
    return "meal_photo_generated";
  if (trimToNull(recipe?.sourceUrl))
    return inferSourceTypeFromUrl(recipe.sourceUrl);
  if (trimToNull(recipe?.imageDataUrl)) return "cookbook_photo";
  return "manual_entry";
}

export function normalizeRecipe(recipe) {
  if (!recipe || typeof recipe !== "object") return null;
  const ingredients = Array.isArray(recipe.ingredients)
    ? recipe.ingredients.map(normalizeIngredient).filter(Boolean)
    : [];
  const steps = Array.isArray(recipe.steps)
    ? recipe.steps.map(normalizeStep).filter(Boolean)
    : [];
  const sourceType = inferLegacyRecipeSourceType(recipe);
  const sourceUrl = cleanUrl(recipe.sourceUrl);
  const createdAt = trimToNull(recipe.createdAt) || new Date().toISOString();
  return {
    id: trimToNull(recipe.id) || uid(),
    name:
      trimToNull(recipe.name) || trimToNull(recipe.title) || "Untitled Recipe",
    description: trimToNull(recipe.description),
    createdAt,
    updatedAt: trimToNull(recipe.updatedAt) || createdAt,
    ingredients,
    imageDataUrl: trimToNull(recipe.imageDataUrl),
    steps,
    meta:
      recipe.meta && typeof recipe.meta === "object"
        ? {
            cuisine: trimToNull(recipe.meta.cuisine),
            servings: trimToNull(recipe.meta.servings),
            prepTime: trimToNull(recipe.meta.prepTime),
            cookTime: trimToNull(recipe.meta.cookTime),
            nutrition: normalizeNutritionMeta(recipe.meta.nutrition),
          }
        : null,
    tags: Array.isArray(recipe.tags)
      ? recipe.tags.map((tag) => String(tag).trim()).filter(Boolean)
      : [],
    sourceType,
    sourceUrl,
    sourceTitle: trimToNull(recipe.sourceTitle) || hostFromUrl(sourceUrl),
    importMethod:
      trimToNull(recipe.importMethod) ||
      (sourceType === "meal_photo_generated" ? "meal_photo_ai" : "manual"),
    importConfidence: Number.isFinite(Number(recipe.importConfidence))
      ? clamp(Number(recipe.importConfidence))
      : null,
    rawImportText: trimToNull(recipe.rawImportText),
  };
}

export function parseTagsInput(value) {
  return String(value || "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .filter(
      (tag, index, arr) =>
        arr.findIndex((item) => item.toLowerCase() === tag.toLowerCase()) ===
        index,
    );
}

export function normalizePantryItem(item) {
  if (!item || typeof item !== "object") return null;
  const displayName = trimToNull(item.displayName) || trimToNull(item.name);
  if (!displayName) return null;
  return {
    id: trimToNull(item.id) || uid(),
    normalizedName: normalizeIngredientName(displayName),
    displayName,
    category: trimToNull(item.category) || inferShoppingCategory(displayName),
    quantity: trimToNull(item.quantity),
    unit: trimToNull(item.unit),
    purchaseDate: trimToNull(item.purchaseDate),
    expirationDate: trimToNull(item.expirationDate),
    lastUsedDate: trimToNull(item.lastUsedDate),
    source: trimToNull(item.source) || "manual",
    isStaple: Boolean(item.isStaple),
  };
}

export function normalizeDietaryProfile(profile) {
  const value = profile && typeof profile === "object" ? profile : {};
  const dietType = trimToNull(value.dietType) || "none";
  const macroFocus = trimToNull(value.macroFocus) || "balanced";
  const householdSize = Number(value.householdSize);
  const mealsPerWeek = Number(value.mealsPerWeek);
  return {
    dietType: ["none", "vegetarian", "vegan", "pescatarian"].includes(dietType)
      ? dietType
      : "none",
    allergies: Array.isArray(value.allergies)
      ? value.allergies.map((item) => normalizeIngredientName(item)).filter(Boolean)
      : parseTagsInput(value.allergies).map((item) => normalizeIngredientName(item)).filter(Boolean),
    excludedIngredients: Array.isArray(value.excludedIngredients)
      ? value.excludedIngredients.map((item) => normalizeIngredientName(item)).filter(Boolean)
      : parseTagsInput(value.excludedIngredients).map((item) => normalizeIngredientName(item)).filter(Boolean),
    macroFocus: ["balanced", "high_protein", "lower_carb", "budget"].includes(macroFocus)
      ? macroFocus
      : "balanced",
    householdSize: Number.isFinite(householdSize) && householdSize >= 1 ? Math.round(householdSize) : 3,
    mealsPerWeek: Number.isFinite(mealsPerWeek) && mealsPerWeek >= 1 ? Math.round(mealsPerWeek) : 7,
  };
}

export function normalizeNutritionMeta(value) {
  const nutrition = value && typeof value === "object" ? value : {};
  const normalizeNumberString = (input) => {
    const trimmed = trimToNull(input);
    if (!trimmed) return null;
    const num = Number(trimmed);
    return Number.isFinite(num) && num >= 0 ? String(num) : null;
  };
  const normalized = {
    servingSize: trimToNull(nutrition.servingSize),
    calories: normalizeNumberString(nutrition.calories),
    proteinG: normalizeNumberString(nutrition.proteinG),
    carbsG: normalizeNumberString(nutrition.carbsG),
    fatG: normalizeNumberString(nutrition.fatG),
    fiberG: normalizeNumberString(nutrition.fiberG),
    sugarG: normalizeNumberString(nutrition.sugarG),
  };
  return Object.values(normalized).some(Boolean) ? normalized : null;
}

export function emptyDraftNutrition() {
  return {
    servingSize: "",
    calories: "",
    proteinG: "",
    carbsG: "",
    fatG: "",
    fiberG: "",
    sugarG: "",
  };
}

export function nutritionBadgesForRecipe(recipe) {
  const nutrition = normalizeNutritionMeta(recipe?.meta?.nutrition);
  if (!nutrition) return [];

  const calories = Number(nutrition.calories);
  const protein = Number(nutrition.proteinG);
  const carbs = Number(nutrition.carbsG);
  const fiber = Number(nutrition.fiberG);
  const badges = [];

  if (Number.isFinite(protein) && protein >= 20) badges.push("High Protein");
  if (Number.isFinite(carbs) && carbs <= 20) badges.push("Lower Carb");
  if (Number.isFinite(fiber) && fiber >= 5) badges.push("High Fiber");
  if (Number.isFinite(calories) && calories <= 450) badges.push("Lighter");

  return badges;
}

// ─── Date Utilities ───

export function parseDateOnly(value) {
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function isoDateFromDate(value) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function startOfWeekIso(isoDate) {
  const date = parseDateOnly(isoDate) || new Date();
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return isoDateFromDate(date);
}

export function weekDates(isoDate) {
  const start = parseDateOnly(startOfWeekIso(isoDate)) || new Date();
  return Array.from({ length: 7 }, (_, idx) => {
    const date = new Date(start);
    date.setDate(start.getDate() + idx);
    return isoDateFromDate(date);
  });
}

export function addDaysIso(isoDate, days) {
  const start = parseDateOnly(isoDate) || new Date();
  start.setDate(start.getDate() + days);
  return isoDateFromDate(start);
}

export function formatPlanDateLabel(isoDate) {
  try {
    return new Date(`${isoDate}T00:00:00`).toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  } catch {
    return isoDate;
  }
}

export function mealSlotLabel(slot) {
  if (slot === "breakfast") return "Breakfast";
  if (slot === "lunch") return "Lunch";
  return "Dinner";
}

// ─── Shopping / Pantry Matching ───

export function inferShoppingCategory(name) {
  const value = String(name || "").toLowerCase();
  if (/(milk|cheese|butter|yogurt|cream|egg)/.test(value)) return "Dairy";
  if (/(chicken|beef|pork|turkey|salmon|tuna|shrimp|fish)/.test(value))
    return "Protein";
  if (
    /(apple|banana|lettuce|spinach|onion|garlic|tomato|potato|carrot|avocado|lemon|lime|cilantro|parsley|zucchini|mushroom)/.test(
      value,
    )
  )
    return "Produce";
  if (
    /(rice|pasta|beans|flour|sugar|oil|vinegar|broth|stock|corn|can|package|salt|pepper|paprika|cumin|vanilla)/.test(
      value,
    )
  )
    return "Pantry";
  if (/(frozen)/.test(value)) return "Frozen";
  return "Other";
}

export const PANTRY_DESCRIPTOR_WORDS = new Set([
  "fresh",
  "dried",
  "large",
  "small",
  "medium",
  "extra",
  "virgin",
  "ground",
  "boneless",
  "skinless",
  "shredded",
  "grated",
  "chopped",
  "diced",
  "minced",
  "sliced",
  "whole",
  "plain",
  "unsalted",
  "salted",
  "lean",
  "low",
  "fat",
  "reduced",
  "organic",
]);

// Exact equivalents: always safe to merge in shopping lists and pantry matching
export const INGREDIENT_EXACT_ALIASES = {
  scallions: "green onion",
  scallion: "green onion",
  "green onions": "green onion",
  "spring onions": "green onion",
  "spring onion": "green onion",
  "cilantro leaves": "cilantro",
  "bell peppers": "bell pepper",
  peppers: "bell pepper",
  "chicken breasts": "chicken breast",
  "chicken thighs": "chicken thigh",
};

// Loose aliases: only used for pantry hint matching, NOT for shopping merge
export const PANTRY_LOOSE_ALIASES = {
  "roma tomatoes": "tomato",
  "cherry tomatoes": "tomato",
  "cheddar cheese": "cheese",
  "parmesan cheese": "cheese",
  "mozzarella cheese": "cheese",
  "olive oil": "oil",
  "vegetable oil": "oil",
};

// Combined map used only by pantry hint matching
export const PANTRY_NAME_ALIASES = { ...INGREDIENT_EXACT_ALIASES, ...PANTRY_LOOSE_ALIASES };

export function singularizeToken(token) {
  const value = String(token || "");
  if (value.endsWith("ies") && value.length > 4)
    return `${value.slice(0, -3)}y`;
  if (value.endsWith("oes") && value.length > 4) return value.slice(0, -2);
  if (
    value.endsWith("es") &&
    value.length > 4 &&
    /(ches|shes|xes|zes|sses)$/.test(value)
  )
    return value.slice(0, -2);
  if (value.endsWith("s") && value.length > 3 && !value.endsWith("ss"))
    return value.slice(0, -1);
  return value;
}

export function canonicalPantryName(value) {
  const normalized = normalizeIngredientName(value);
  const aliasValue = PANTRY_NAME_ALIASES[normalized] || normalized;
  return aliasValue
    .split(" ")
    .map((token) => singularizeToken(token))
    .filter((token) => token && !PANTRY_DESCRIPTOR_WORDS.has(token))
    .join(" ")
    .trim();
}

export function canonicalShoppingName(value) {
  const normalized = normalizeIngredientName(value);
  const aliasValue = INGREDIENT_EXACT_ALIASES[normalized] || normalized;
  return aliasValue
    .split(" ")
    .map((token) => singularizeToken(token))
    .filter((token) => token && !PANTRY_DESCRIPTOR_WORDS.has(token))
    .join(" ")
    .trim();
}

export function shoppingMergeKey(name, unit) {
  const canonical = canonicalShoppingName(name);
  const normalUnit = normalizedUnit(unit) || "-";
  return `${canonical}|${normalUnit}`;
}

export function pantryTokenSet(value) {
  return new Set(
    canonicalPantryName(value)
      .split(" ")
      .map((token) => token.trim())
      .filter(Boolean),
  );
}

export function normalizedUnit(unit) {
  return normalizeUnitValue(unit) || trimToNull(unit)?.toLowerCase() || null;
}

export function unitFamily(unit) {
  const value = normalizedUnit(unit);
  if (!value) return null;
  if (["oz", "lb", "g", "kg"].includes(value)) return "weight";
  if (["tsp", "tbsp", "cup"].includes(value)) return "volume";
  if (["clove", "can", "package"].includes(value)) return "count";
  return value;
}

export function convertAmountToBase(amount, unit) {
  if (!Number.isFinite(amount)) return null;
  const value = normalizedUnit(unit);
  if (!value) return amount;
  const factors = {
    oz: 1,
    lb: 16,
    g: 0.035274,
    kg: 35.274,
    tsp: 1,
    tbsp: 3,
    cup: 48,
  };
  return Number.isFinite(factors[value]) ? amount * factors[value] : amount;
}

// ─── Ingredient Enrichment ───

export function enrichIngredientFields(ing) {
  const enriched = { ...ing };
  const missingQty = !trimToNull(enriched.quantity);
  const missingUnit = !trimToNull(enriched.unit);
  if (!enriched.rawLine || (!missingQty && !missingUnit)) return enriched;
  const reparsed = parseIngredientLine(
    String(enriched.rawLine),
    enriched.confidence || 0.6,
  );
  if (!reparsed) return enriched;
  if (missingQty && trimToNull(reparsed.quantity))
    enriched.quantity = trimToNull(reparsed.quantity);
  if (missingUnit && trimToNull(reparsed.unit))
    enriched.unit = trimToNull(reparsed.unit);
  return enriched;
}
