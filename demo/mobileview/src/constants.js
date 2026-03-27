// ─── Constants ───
export const STORAGE_KEY = "recipe-scanner-demo.v5";
export const OCR_PROXY_ENDPOINT = "http://127.0.0.1:8765/ocr";
export const OCR_PROXY_TIMEOUT_MS = 120_000;
export const DECAY_API_ENDPOINT = "http://127.0.0.1:8765/decay";
export const URL_IMPORT_API_ENDPOINT = "http://127.0.0.1:8765/import-recipe-url";
export const MAX_LOGS = 240;

export const NAV_META = {
  "scan-view": { title: "Scanner", action: null },
  "recipes-view": { title: "Recipes", action: "merge" },
  "shopping-view": { title: "Shopping List", action: "clear" },
  "pantry-view": { title: "Pantry", action: null },
  "settings-view": { title: "Settings", action: null },
};

export const COMMON_UNITS = new Set([
  "c", "cup", "cups", "tbsp", "tablespoon", "tablespoons",
  "tsp", "teaspoon", "teaspoons", "oz", "ounce", "ounces",
  "lb", "lbs", "pound", "pounds", "g", "gram", "grams",
  "kg", "ml", "l", "clove", "cloves", "can", "cans",
  "pkg", "package", "packages", "pinch", "dash",
]);

export const BLOCKED_PREFIXES = new Set([
  "instructions", "direction", "directions", "steps", "method",
  "serves", "yield", "nutrition", "notes", "tip", "tips", "ingredients",
]);

export const SECTION_END_PREFIXES = new Set([
  "instructions", "direction", "directions", "steps", "method",
  "nutrition", "notes", "tip", "tips", "serves", "yield",
]);

export const INSTRUCTION_HINT_WORDS = new Set([
  "preheat", "mix", "stir", "cook", "bake", "combine",
  "whisk", "simmer", "boil", "serve", "heat", "pour", "add",
]);

export const STOP_WORDS = new Set([
  "for", "with", "and", "the", "a", "an", "to", "of",
  "fresh", "optional", "or", "plus", "room", "temperature",
  "chopped", "diced", "minced", "sliced", "large", "small", "medium",
]);

export const INGREDIENT_HINT_WORDS = new Set([
  "flour", "sugar", "salt", "pepper", "oil", "olive", "garlic",
  "onion", "milk", "butter", "egg", "eggs", "water", "rice",
  "pasta", "tomato", "chicken", "beef", "pork", "cheese", "lemon",
  "lime", "vinegar", "basil", "parsley", "oregano", "paprika",
  "cumin", "coriander", "potato", "carrot", "celery", "broth",
  "stock", "cream", "yogurt", "honey", "vanilla", "baking",
  "powder", "soda", "yeast", "cornstarch", "beans", "lentils",
  "cilantro", "shrimp", "salmon", "tuna", "avocado", "spinach",
  "mushroom", "zucchini", "cabbage", "ginger", "chili", "chile",
]);

export const FRACTION_MAP = {
  "\u00bc": "1/4", "\u00bd": "1/2", "\u00be": "3/4",
  "\u2153": "1/3", "\u2154": "2/3", "\u215b": "1/8",
  "\u215c": "3/8", "\u215d": "5/8", "\u215e": "7/8",
};

export const SAMPLE_RECIPE_TEXT = `Mexican Grilled Chicken Bowl
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

export const MEAL_API_ENDPOINT = "http://127.0.0.1:8765/analyze-meal";

export const SAMPLE_MEAL_ANALYSIS = {
  name: "Mexican Grilled Chicken Bowl",
  description:
    "A vibrant bowl featuring seasoned grilled chicken, fluffy rice, black beans, fresh vegetables, and creamy toppings.",
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
    { step: 3, instruction: "Preheat a grill pan or outdoor grill to medium-high heat (400\u00b0F / 200\u00b0C).", temperature: "400\u00b0F (200\u00b0C)", duration: null },
    { step: 4, instruction: "Grill chicken breasts for 6-7 minutes per side until internal temperature reaches 165\u00b0F (74\u00b0C). Let rest 5 minutes before slicing.", temperature: "165\u00b0F (74\u00b0C)", duration: "14 minutes" },
    { step: 5, instruction: "While chicken rests, heat remaining 1 tbsp olive oil in a skillet over medium heat. Add corn kernels and cook until slightly charred.", temperature: null, duration: "4 minutes" },
    { step: 6, instruction: "Warm black beans in a small saucepan over medium-low heat. Season with a pinch of cumin and salt.", temperature: null, duration: "3 minutes" },
    { step: 7, instruction: "Slice the grilled chicken into 1/2-inch strips.", temperature: null, duration: null },
    { step: 8, instruction: "Divide cooked rice evenly among 4 bowls as the base.", temperature: null, duration: null },
    { step: 9, instruction: "Arrange sliced chicken, black beans, charred corn, shredded lettuce, and avocado slices on top of the rice.", temperature: null, duration: null },
    { step: 10, instruction: "Top each bowl with salsa, a dollop of sour cream, shredded cheese, and fresh cilantro.", temperature: null, duration: null },
    { step: 11, instruction: "Squeeze fresh lime juice over each bowl and serve immediately.", temperature: null, duration: null },
  ],
};

export const RECIPE_SOURCE_LABELS = {
  cookbook_photo: "Cookbook Page",
  printed_recipe_photo: "Printed Recipe",
  handwritten_card_photo: "Handwritten Card",
  screenshot: "Screenshot",
  recipe_url: "Recipe URL",
  social_url: "Social Recipe",
  manual_entry: "Manual Entry",
  meal_photo_generated: "Meal Photo AI",
};

export const RECIPE_SOURCE_TYPES = new Set(Object.keys(RECIPE_SOURCE_LABELS));
export const MEAL_SLOTS = ["breakfast", "lunch", "dinner"];

// ─── Dietary Constants ───
export const DIET_CONFLICT_RULES = {
  vegetarian: {
    label: "vegetarian",
    pattern: /\b(chicken|beef|pork|turkey|lamb|sausage|bacon|ham|salami|pepperoni|anchovy|tuna|salmon|shrimp|fish)\b/,
  },
  vegan: {
    label: "vegan",
    pattern: /\b(chicken|beef|pork|turkey|lamb|sausage|bacon|ham|salami|pepperoni|anchovy|tuna|salmon|shrimp|fish|milk|butter|cheese|cream|yogurt|egg|honey)\b/,
  },
  pescatarian: {
    label: "pescatarian",
    pattern: /\b(chicken|beef|pork|turkey|lamb|sausage|bacon|ham|salami|pepperoni)\b/,
  },
};

export const ALLERGY_PATTERNS = {
  dairy: /\b(milk|butter|cheese|cream|yogurt|whey)\b/,
  egg: /\b(egg|eggs|mayonnaise)\b/,
  gluten: /\b(flour|bread|pasta|soy sauce|breadcrumbs|tortilla)\b/,
  nuts: /\b(almond|walnut|pecan|cashew|peanut|pistachio|hazelnut)\b/,
  shellfish: /\b(shrimp|prawn|crab|lobster|scallop)\b/,
  soy: /\b(soy sauce|tofu|miso|edamame|soy)\b/,
};

export const SUBSTITUTION_RULES = [
  { trigger: /\bmilk\b/, issues: ["dairy", "vegan"], suggestion: "unsweetened oat milk", note: "Works well in most savory and baked recipes." },
  { trigger: /\bbutter\b/, issues: ["dairy", "vegan"], suggestion: "olive oil or vegan butter", note: "Good for sauteing or simple baking swaps." },
  { trigger: /\bcream\b/, issues: ["dairy", "vegan"], suggestion: "coconut milk or cashew cream", note: "Best in soups, sauces, and curries." },
  { trigger: /\bcheese\b/, issues: ["dairy", "vegan"], suggestion: "plant-based cheese or nutritional yeast", note: "Use based on whether melt or savory flavor matters more." },
  { trigger: /\begg\b/, issues: ["egg", "vegan"], suggestion: "flax egg or commercial egg replacer", note: "Best for binding in baking." },
  { trigger: /\bflour\b/, issues: ["gluten"], suggestion: "1:1 gluten-free flour blend", note: "Simplest swap for general cooking and baking." },
  { trigger: /\bsoy sauce\b/, issues: ["gluten", "soy"], suggestion: "tamari or coconut aminos", note: "Choose tamari for closer flavor, coconut aminos for soy-free." },
  { trigger: /\bshrimp\b/, issues: ["shellfish"], suggestion: "chicken, tofu, or white beans", note: "Pick based on the role of the protein in the recipe." },
  { trigger: /\bchicken\b/, issues: ["vegetarian", "vegan"], suggestion: "chickpeas, tofu, or mushrooms", note: "Use tofu for protein, mushrooms for savory texture." },
  { trigger: /\bbeef\b/, issues: ["vegetarian", "vegan", "pescatarian"], suggestion: "lentils, mushrooms, or plant-based ground", note: "Good in soups, bowls, tacos, and pasta sauces." },
];
