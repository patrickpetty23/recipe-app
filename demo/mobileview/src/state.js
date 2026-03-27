/* ──────────────────────────────────────────────
   Recipe Scanner — State Management
   makeDefaultState, loadState, saveState, state singleton
   ────────────────────────────────────────────── */

import { STORAGE_KEY, NAV_META } from "./constants.js";
import {
  normalizeRecipe, normalizePantryItem, normalizeDietaryProfile,
  trimToNull, todayIsoDate,
} from "./utils.js";

export function makeDefaultState() {
  return {
    recipes: [],
    activeShoppingList: null,
    mealPlanEntries: [],
    pantryItems: [],
    logs: [],
    selectedImageDataUrl: null,
    draftRecipeName: "",
    draftDescription: "",
    draftTags: [],
    draftNutrition: {
      servingSize: "",
      calories: "",
      proteinG: "",
      carbsG: "",
      fatG: "",
      fiberG: "",
      sugarG: "",
    },
    draftIngredients: [],
    draftSourceType: "manual_entry",
    draftSourceTitle: "",
    draftSourceUrl: "",
    draftImportMethod: "manual",
    rawOCRText: "",
    ocrConfidence: 0,
    ocrSource: null,
    droppedOCRLines: [],
    isProcessing: false,
    scanErrorMessage: null,
    lowConfidenceWarning: null,
    showEditor: false,
    settings: {
      useCloudFallback: true,
      lowConfidenceThreshold: 0.7,
      dietaryProfile: {
        dietType: "none",
        allergies: [],
        excludedIngredients: [],
        macroFocus: "balanced",
      },
    },
    ui: {
      activeView: "scan-view",
      recipeSearch: "",
      recipeSourceFilter: "all",
      recipeSort: "newest",
      recipesCompatibleOnly: false,
      mealPlanSelectedDate: todayIsoDate(),
      mealPlanSelectedSlot: "dinner",
      pantryEditId: null,
    },
    detail: { recipeId: null },
    editingRecipeId: null,
    pendingConfirm: null,
    usedSample: false,
    scanMode: "recipe",
    selectedImages: [],
    mealImageDataUrl: null,
    mealAnalysis: null,
    draftSteps: [],
    decay: { result: null, error: null, pending: false },
  };
}

export function loadState() {
  const fallback = makeDefaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return {
      ...fallback,
      recipes: Array.isArray(parsed.recipes)
        ? parsed.recipes.map(normalizeRecipe).filter(Boolean)
        : [],
      activeShoppingList: parsed.activeShoppingList || null,
      mealPlanEntries: Array.isArray(parsed.mealPlanEntries)
        ? parsed.mealPlanEntries
        : [],
      pantryItems: Array.isArray(parsed.pantryItems)
        ? parsed.pantryItems.map(normalizePantryItem).filter(Boolean)
        : [],
      logs: Array.isArray(parsed.logs) ? parsed.logs : [],
      settings: {
        ...fallback.settings,
        ...(parsed.settings || {}),
        dietaryProfile: normalizeDietaryProfile(
          parsed?.settings?.dietaryProfile || fallback.settings.dietaryProfile,
        ),
      },
      ui: {
        activeView: NAV_META[parsed?.ui?.activeView]
          ? parsed.ui.activeView
          : "scan-view",
        recipeSearch: trimToNull(parsed?.ui?.recipeSearch) || "",
        recipeSourceFilter: trimToNull(parsed?.ui?.recipeSourceFilter) || "all",
        recipeSort: trimToNull(parsed?.ui?.recipeSort) || "newest",
        recipesCompatibleOnly: Boolean(parsed?.ui?.recipesCompatibleOnly),
        mealPlanSelectedDate:
          trimToNull(parsed?.ui?.mealPlanSelectedDate) || todayIsoDate(),
        mealPlanSelectedSlot:
          trimToNull(parsed?.ui?.mealPlanSelectedSlot) || "dinner",
        pantryEditId: trimToNull(parsed?.ui?.pantryEditId) || null,
      },
    };
  } catch {
    return fallback;
  }
}

export const state = loadState();

export function saveState() {
  const payload = {
    recipes: state.recipes,
    activeShoppingList: state.activeShoppingList,
    mealPlanEntries: state.mealPlanEntries,
    pantryItems: state.pantryItems,
    logs: state.logs,
    settings: state.settings,
    ui: {
      activeView: state.ui.activeView,
      recipeSearch: state.ui.recipeSearch,
      recipeSourceFilter: state.ui.recipeSourceFilter,
      recipeSort: state.ui.recipeSort,
      recipesCompatibleOnly: !!state.ui.recipesCompatibleOnly,
      mealPlanSelectedDate: state.ui.mealPlanSelectedDate,
      mealPlanSelectedSlot: state.ui.mealPlanSelectedSlot,
      pantryEditId: state.ui.pantryEditId,
    },
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* quota */
  }
}
