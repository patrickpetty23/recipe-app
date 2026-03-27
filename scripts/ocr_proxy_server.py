#!/usr/bin/env python3
"""
Local OCR proxy for demo/mobileview.

Why this exists:
- Browser demos cannot call many OCR APIs directly due to CORS restrictions.
- This proxy lets the demo use higher-accuracy cloud OCR from OCR.Space.

Default behavior:
- Binds to 127.0.0.1:8765
- Exposes POST /ocr
- Accepts JSON body: {"imageDataUrl":"data:image/png;base64,..."}
- Calls OCR.Space engine 2 first, then engine 1 fallback
"""

from __future__ import annotations

import html
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any


HOST = os.getenv("OCR_PROXY_HOST", "127.0.0.1")
PORT = int(os.getenv("OCR_PROXY_PORT", "8765"))
OCR_SPACE_URL = "https://api.ocr.space/parse/image"
DEFAULT_API_KEY = os.getenv("OCR_SPACE_API_KEY", "")
REQUEST_TIMEOUT_SECONDS = int(os.getenv("OCR_PROXY_TIMEOUT_SECONDS", "120"))
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_PROJECT_ID = os.getenv("OPENAI_PROJECT_ID", "")
OPENAI_API_URL = "https://api.openai.com/v1/chat/completions"
OPENAI_TIMEOUT_SECONDS = int(os.getenv("OPENAI_TIMEOUT_SECONDS", "90"))

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

_PRODUCTION_MODEL_PATH = os.path.join(ROOT_DIR, "reports", "production_model.json")
_MODEL_META_PATH = os.path.join(ROOT_DIR, "reports", "model_meta.json")
DECAY_MODEL_META = _PRODUCTION_MODEL_PATH if os.path.exists(_PRODUCTION_MODEL_PATH) else _MODEL_META_PATH
DECAY_USDA_PATH = os.path.join(ROOT_DIR, "data", "usda_shelf_life.json")
DECAY_SERVICE = None
DECAY_LOAD_ERROR = None

try:
    from ml.inference_service import InferenceService, load_model_path, load_usda_map
except Exception as error:  # noqa: BLE001
    InferenceService = None
    load_model_path = None
    load_usda_map = None
    DECAY_LOAD_ERROR = f"ML service import failed: {error}"


def get_decay_service() -> tuple[Any | None, str | None]:
    global DECAY_SERVICE, DECAY_LOAD_ERROR  # noqa: PLW0603
    if DECAY_SERVICE is not None:
        return DECAY_SERVICE, None
    if DECAY_LOAD_ERROR:
        return None, DECAY_LOAD_ERROR
    if not (load_model_path and load_usda_map and InferenceService):
        return None, "ML service not available"
    try:
        if not os.path.exists(DECAY_MODEL_META):
            return None, f"Missing model meta file: {DECAY_MODEL_META}"
        if not os.path.exists(DECAY_USDA_PATH):
            return None, f"Missing USDA mapping: {DECAY_USDA_PATH}"
        model_path = load_model_path(DECAY_MODEL_META)
        usda_map = load_usda_map(DECAY_USDA_PATH)
        DECAY_SERVICE = InferenceService(model_path, usda_map)
        return DECAY_SERVICE, None
    except Exception as error:  # noqa: BLE001
        DECAY_LOAD_ERROR = f"Failed to load ML service: {error}"
        return None, DECAY_LOAD_ERROR

COMMON_UNITS = {
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
}

BLOCKED_PREFIXES = {
    "instructions",
    "direction",
    "directions",
    "steps",
    "method",
    "nutrition",
    "notes",
    "tip",
    "tips",
    "serves",
    "yield",
}

INGREDIENT_HINT_WORDS = {
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
}


def clamp(value: float, lower: float = 0.0, upper: float = 1.0) -> float:
    return max(lower, min(upper, value))


def clean_line(text: str) -> str:
    return " ".join(str(text or "").split()).strip()


def lines_from_result_payload(payload: dict[str, Any]) -> tuple[list[dict[str, Any]], str, float]:
    parsed_results = payload.get("ParsedResults") or []
    lines: list[dict[str, Any]] = []
    raw_blocks: list[str] = []

    for block in parsed_results:
        parsed_text = str(block.get("ParsedText") or "").strip()
        if parsed_text:
            raw_blocks.append(parsed_text)

        overlay = block.get("TextOverlay") or {}
        overlay_lines = overlay.get("Lines") or []
        for line in overlay_lines:
            words = line.get("Words") or []
            word_texts = [clean_line(word.get("WordText", "")) for word in words]
            word_texts = [value for value in word_texts if value]
            text = clean_line(" ".join(word_texts))
            if not text:
                text = clean_line(line.get("LineText", ""))
            if not text:
                continue

            confidences = [
                float(word.get("Confidence"))
                for word in words
                if isinstance(word.get("Confidence"), (int, float))
            ]
            if confidences:
                confidence = clamp((sum(confidences) / len(confidences)) / 100.0)
            else:
                confidence = 0.9
            lines.append({"text": text, "confidence": confidence})

    if not lines:
        fallback_text = "\n".join(raw_blocks).strip()
        if fallback_text:
            for row in fallback_text.splitlines():
                text = clean_line(row)
                if text:
                    lines.append({"text": text, "confidence": 0.88})

    raw_text = "\n".join(line["text"] for line in lines).strip()
    if not raw_text:
        raw_text = "\n".join(raw_blocks).strip()
    average_confidence = (
        clamp(sum(float(line.get("confidence", 0.0)) for line in lines) / len(lines)) if lines else 0.0
    )
    return lines, raw_text, average_confidence


def score_ocr_result(lines: list[dict[str, Any]], raw_text: str, average_confidence: float) -> float:
    char_count = sum(len(str(line.get("text", ""))) for line in lines)
    return (
        len(lines) * 2.2
        + min(char_count, 500) / 55.0
        + clamp(average_confidence) * 4.5
    )


def normalize_line(text: str) -> str:
    value = clean_line(text).lower()
    value = value.replace("•", " ").replace("\t", " ")
    units_pattern = (
        r"(tablespoons?|tbsp|teaspoons?|tsp|ounces?|oz|pounds?|lbs?|lb|grams?|gram|g|kg|ml|l|"
        r"cloves?|clove|cans?|can|packages?|package|pkg|pinch|dash|cups?|cup)"
    )
    value = re.sub(rf"(\d[\d./-]*)(?:\s*)({units_pattern})(?=[a-z])", r"\1 \2 ", value, flags=re.I)
    value = re.sub(rf"\b({units_pattern})([a-z]{{3,}})\b", r"\1 \2", value, flags=re.I)
    value = re.sub(r"(\d)([a-zA-Z])", r"\1 \2", value)
    value = re.sub(r"([a-zA-Z])(\d)", r"\1 \2", value)
    value = re.sub(r"\s+", " ", value).strip()
    return value


def symbol_ratio(text: str) -> float:
    if not text:
        return 1.0
    symbols = len(re.findall(r"[^a-zA-Z0-9\s./,()\-]", text))
    return symbols / max(len(text), 1)


def is_quantity_token(token: str) -> bool:
    token = token.strip().lower()
    if not token:
        return False
    return bool(
        re.match(
            r"^\d+$|^\d+\.\d+$|^\d+/\d+$|^\d+-\d+$|^\d+-\d+/\d+$|^\d+\s+\d+/\d+$",
            token,
        )
    )


def normalize_unit(token: str) -> str:
    normalized = re.sub(r"^[^a-z0-9]+|[^a-z0-9]+$", "", token.lower())
    if normalized in {"tablespoon", "tablespoons"}:
        return "tbsp"
    if normalized in {"teaspoon", "teaspoons"}:
        return "tsp"
    if normalized in {"ounce", "ounces"}:
        return "oz"
    if normalized in {"pound", "pounds", "lbs"}:
        return "lb"
    if normalized in {"cups"}:
        return "cup"
    if normalized in {"cloves"}:
        return "clove"
    if normalized in {"cans"}:
        return "can"
    if normalized in {"packages"}:
        return "package"
    return normalized


def levenshtein_distance(a: str, b: str) -> int:
    if a == b:
        return 0
    if not a:
        return len(b)
    if not b:
        return len(a)
    if len(a) < len(b):
        a, b = b, a
    previous = list(range(len(b) + 1))
    for i, char_a in enumerate(a, start=1):
        current = [i]
        for j, char_b in enumerate(b, start=1):
            insert_cost = current[j - 1] + 1
            delete_cost = previous[j] + 1
            replace_cost = previous[j - 1] + (char_a != char_b)
            current.append(min(insert_cost, delete_cost, replace_cost))
        previous = current
    return previous[-1]


def fuzzy_hint_hit(token: str) -> bool:
    token = token.lower().strip()
    if len(token) < 3:
        return False
    if token in INGREDIENT_HINT_WORDS:
        return True
    max_distance = 1 if len(token) <= 5 else 2
    for hint in INGREDIENT_HINT_WORDS:
        if abs(len(hint) - len(token)) > max_distance:
            continue
        if levenshtein_distance(token, hint) <= max_distance:
            return True
    return False


def is_readable_name(name: str) -> bool:
    name = clean_line(name)
    if not name:
        return False
    letters = re.findall(r"[a-zA-Z]", name)
    digits = re.findall(r"\d", name)
    compact = re.sub(r"\s+", "", name)
    alpha_ratio = len(letters) / max(len(compact), 1)
    digit_ratio = len(digits) / max(len(compact), 1)
    if len(letters) < 3:
        return False
    if alpha_ratio < 0.58:
        return False
    if digit_ratio > 0.16:
        return False
    if symbol_ratio(name) > 0.14:
        return False
    words = re.findall(r"[a-zA-Z]+", name.lower())
    if not words or len(words) > 6:
        return False
    long_words = [word for word in words if len(word) >= 3]
    if not long_words:
        return False
    return True


def parse_ingredient_line(text: str, confidence: float) -> dict[str, Any] | None:
    normalized = normalize_line(text)
    if not normalized:
        return None
    if symbol_ratio(normalized) > 0.17:
        return None

    tokens = normalized.split()
    if not tokens:
        return None
    first_token = tokens[0]
    if first_token in BLOCKED_PREFIXES:
        return None

    quantity_parts: list[str] = []
    while tokens and is_quantity_token(tokens[0]) and len(quantity_parts) < 2:
        quantity_parts.append(tokens.pop(0))

    unit = None
    if tokens:
        candidate_unit = normalize_unit(tokens[0])
        if candidate_unit in COMMON_UNITS:
            unit = candidate_unit
            tokens.pop(0)

    name = clean_line(" ".join(tokens))
    name = re.sub(r"^[,.:;\-]+|[,.:;\-]+$", "", name).strip()
    if not name:
        return None

    if not is_readable_name(name):
        return None

    hint_hits = sum(1 for token in re.findall(r"[a-zA-Z]+", name.lower()) if fuzzy_hint_hit(token))
    has_measurement = bool(quantity_parts or unit)
    if hint_hits == 0 and not has_measurement:
        return None

    score = clamp(confidence + (0.08 if quantity_parts else 0) + (0.08 if unit else 0))
    if hint_hits:
        score = clamp(score + 0.08)

    return {
        "name": name,
        "quantity": " ".join(quantity_parts) if quantity_parts else None,
        "unit": unit,
        "confidence": round(score, 4),
        "rawLine": clean_line(text),
    }


def extract_structured_ingredients(lines: list[dict[str, Any]]) -> dict[str, Any]:
    ingredients: list[dict[str, Any]] = []
    dropped: list[str] = []
    seen: set[str] = set()

    for line in lines:
        text = clean_line(str(line.get("text", "")))
        confidence = clamp(float(line.get("confidence", 0.6)))
        if not text:
            continue
        if confidence < 0.25:
            dropped.append(text)
            continue

        parsed = parse_ingredient_line(text, confidence)
        if not parsed:
            dropped.append(text)
            continue

        key = f"{parsed['name'].lower()}|{(parsed.get('quantity') or '-').lower()}|{(parsed.get('unit') or '-').lower()}"
        if key in seen:
            continue
        seen.add(key)
        ingredients.append(parsed)

    ingredient_count = len(ingredients)
    avg_confidence = (
        clamp(sum(float(item.get("confidence", 0.0)) for item in ingredients) / ingredient_count)
        if ingredient_count
        else 0.0
    )
    quantity_coverage = (
        sum(1 for item in ingredients if item.get("quantity")) / ingredient_count if ingredient_count else 0.0
    )
    unit_coverage = (
        sum(1 for item in ingredients if item.get("unit")) / ingredient_count if ingredient_count else 0.0
    )
    quality = clamp(avg_confidence * 0.55 + quantity_coverage * 0.25 + unit_coverage * 0.2)

    return {
        "ingredients": ingredients,
        "droppedLines": dropped,
        "metrics": {
            "ingredientCount": ingredient_count,
            "droppedCount": len(dropped),
            "avgConfidence": round(avg_confidence, 4),
            "quantityCoverage": round(quantity_coverage, 4),
            "unitCoverage": round(unit_coverage, 4),
            "qualityScore": round(quality, 4),
        },
    }


def infer_source_type_from_url(url: str) -> str:
    host = urllib.parse.urlparse(url).netloc.lower()
    host = host.replace("www.", "")
    if re.search(r"(tiktok|pinterest|instagram|youtube|youtu\.be)", host):
        return "social_url"
    return "recipe_url"


def strip_html_to_text(html_text: str) -> str:
    text = re.sub(r"(?is)<(script|style)\b.*?>.*?</\1>", " ", html_text)
    text = re.sub(r"(?i)<br\s*/?>", "\n", text)
    text = re.sub(r"(?i)</p>|</li>|</div>|</h\d>", "\n", text)
    text = re.sub(r"(?s)<[^>]+>", " ", text)
    text = html.unescape(text)
    text = re.sub(r"\r", "", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return "\n".join(clean_line(line) for line in text.splitlines() if clean_line(line))


def extract_title_from_html(html_text: str) -> str | None:
    match = re.search(r"(?is)<title[^>]*>(.*?)</title>", html_text)
    if not match:
        return None
    return clean_line(html.unescape(match.group(1)))


def extract_json_ld_candidates(html_text: str) -> list[Any]:
    blocks = re.findall(
        r'(?is)<script[^>]+type=["\']application/ld\+json["\'][^>]*>(.*?)</script>',
        html_text,
    )
    candidates: list[Any] = []
    for block in blocks:
        cleaned = html.unescape(block).strip()
        if not cleaned:
            continue
        try:
            parsed = json.loads(cleaned)
        except json.JSONDecodeError:
            continue
        candidates.append(parsed)
    return candidates


def flatten_json_ld_nodes(node: Any) -> list[dict[str, Any]]:
    if isinstance(node, list):
        out: list[dict[str, Any]] = []
        for item in node:
            out.extend(flatten_json_ld_nodes(item))
        return out
    if isinstance(node, dict):
        if isinstance(node.get("@graph"), list):
            return flatten_json_ld_nodes(node["@graph"])
        return [node]
    return []


def find_recipe_node(candidates: list[Any]) -> dict[str, Any] | None:
    for candidate in candidates:
        for node in flatten_json_ld_nodes(candidate):
            node_type = node.get("@type")
            types = node_type if isinstance(node_type, list) else [node_type]
            normalized = {str(item).lower() for item in types if item}
            if "recipe" in normalized:
                return node
    return None


def coerce_instruction_steps(value: Any) -> list[dict[str, Any]]:
    if isinstance(value, str):
        lines = [clean_line(line) for line in value.splitlines() if clean_line(line)]
        return [
            {"step": idx + 1, "instruction": line, "temperature": None, "duration": None}
            for idx, line in enumerate(lines)
        ]

    if isinstance(value, list):
        steps: list[dict[str, Any]] = []
        for item in value:
            if isinstance(item, str):
                instruction = clean_line(item)
            elif isinstance(item, dict):
                instruction = clean_line(
                    item.get("text")
                    or item.get("name")
                    or item.get("itemListElement")
                    or ""
                )
            else:
                instruction = ""
            if instruction:
                steps.append(
                    {
                        "step": len(steps) + 1,
                        "instruction": instruction,
                        "temperature": None,
                        "duration": None,
                    }
                )
        return steps
    return []


def coerce_ingredient_items(items: Any) -> list[dict[str, Any]]:
    if not isinstance(items, list):
        return []
    parsed_items: list[dict[str, Any]] = []
    for item in items:
        line = clean_line(str(item))
        if not line:
            continue
        parsed = parse_ingredient_line(line, 0.9)
        if parsed:
            parsed_items.append(parsed)
        else:
            parsed_items.append(
                {
                    "name": line,
                    "quantity": None,
                    "unit": None,
                    "confidence": 0.72,
                    "rawLine": line,
                }
            )
    return parsed_items


def build_text_recipe_fallback(url: str, html_text: str) -> dict[str, Any]:
    raw_text = strip_html_to_text(html_text)
    lines = [{"text": line, "confidence": 0.82} for line in raw_text.splitlines() if clean_line(line)]
    structured = extract_structured_ingredients(lines[:250])
    title = extract_title_from_html(html_text) or urllib.parse.urlparse(url).netloc
    return {
        "name": title,
        "description": None,
        "sourceType": infer_source_type_from_url(url),
        "sourceTitle": urllib.parse.urlparse(url).netloc.replace("www.", ""),
        "sourceUrl": url,
        "importMethod": "url_fetch_fallback",
        "importSourceLabel": "proxy URL import",
        "importConfidence": 0.68 if structured["ingredients"] else 0.42,
        "rawText": raw_text[:12000],
        "ingredients": structured["ingredients"],
        "droppedLines": structured["droppedLines"][:40],
        "steps": [],
        "warning": (
            "Structured recipe data was not detected. Review this draft carefully before saving."
            if structured["ingredients"]
            else "Only a weak draft could be created from this URL. Add ingredients and steps manually."
        ),
    }


def import_recipe_from_url(url: str) -> dict[str, Any]:
    parsed = urllib.parse.urlparse(url)
    if parsed.scheme not in {"http", "https"}:
        raise ValueError("URL must start with http:// or https://")

    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (compatible; RecipeML/1.0; +https://local.recipe-app)",
            "Accept-Language": "en-US,en;q=0.9",
        },
        method="GET",
    )

    with urllib.request.urlopen(request, timeout=REQUEST_TIMEOUT_SECONDS) as response:
        raw_bytes = response.read()
        content_type = response.headers.get_content_charset() or "utf-8"
        html_text = raw_bytes.decode(content_type, errors="replace")

    recipe_node = find_recipe_node(extract_json_ld_candidates(html_text))
    source_type = infer_source_type_from_url(url)
    source_title = urllib.parse.urlparse(url).netloc.replace("www.", "")

    if recipe_node:
        name = clean_line(str(recipe_node.get("name") or "")) or extract_title_from_html(html_text) or source_title
        description = clean_line(str(recipe_node.get("description") or "")) or None
        ingredients = coerce_ingredient_items(recipe_node.get("recipeIngredient"))
        steps = coerce_instruction_steps(recipe_node.get("recipeInstructions"))
        raw_text_parts = [name]
        raw_text_parts.extend(item.get("rawLine") or item.get("name") or "" for item in ingredients)
        raw_text_parts.extend(step.get("instruction") or "" for step in steps)
        raw_text = "\n".join(part for part in raw_text_parts if clean_line(part))
        warning = None
        if not ingredients and not steps:
            warning = "Recipe metadata was found, but ingredient and step extraction was limited."
        return {
            "name": name,
            "description": description,
            "sourceType": source_type,
            "sourceTitle": source_title,
            "sourceUrl": url,
            "importMethod": "url_fetch_jsonld",
            "importSourceLabel": "proxy URL import",
            "importConfidence": 0.92 if ingredients or steps else 0.74,
            "rawText": raw_text[:12000],
            "ingredients": ingredients,
            "droppedLines": [],
            "steps": steps,
            "warning": warning,
        }

    return build_text_recipe_fallback(url, html_text)


def call_ocr_space(image_data_url: str, engine: int, api_key: str) -> dict[str, Any]:
    data = urllib.parse.urlencode(
        {
            "base64Image": image_data_url,
            "language": "eng",
            "OCREngine": str(engine),
            "isOverlayRequired": "true",
            "scale": "true",
            "detectOrientation": "true",
            "isTable": "true",
        }
    ).encode("utf-8")

    request = urllib.request.Request(
        OCR_SPACE_URL,
        data=data,
        method="POST",
        headers={
            "apikey": api_key,
            "Content-Type": "application/x-www-form-urlencoded",
        },
    )

    with urllib.request.urlopen(request, timeout=REQUEST_TIMEOUT_SECONDS) as response:
        body = response.read().decode("utf-8", errors="replace")
        return json.loads(body)


def run_cloud_ocr(image_data_url: str) -> dict[str, Any]:
    if not image_data_url.startswith("data:image/"):
        raise ValueError("imageDataUrl must be a data URL (data:image/*;base64,...).")

    api_key = DEFAULT_API_KEY.strip()
    if not api_key:
        raise RuntimeError("OCR_SPACE_API_KEY is empty.")

    attempts: list[dict[str, Any]] = []
    errors: list[str] = []

    for engine in (2, 1):
        start = time.time()
        try:
            payload = call_ocr_space(image_data_url=image_data_url, engine=engine, api_key=api_key)
            lines, raw_text, average_confidence = lines_from_result_payload(payload)
            elapsed_ms = int((time.time() - start) * 1000)
            attempts.append(
                {
                    "engine": engine,
                    "lines": lines,
                    "rawText": raw_text,
                    "averageConfidence": average_confidence,
                    "payload": payload,
                    "elapsedMs": elapsed_ms,
                }
            )
        except urllib.error.HTTPError as error:
            message = error.read().decode("utf-8", errors="replace")
            errors.append(f"engine {engine} HTTP {error.code}: {message}")
        except Exception as error:  # noqa: BLE001
            errors.append(f"engine {engine} failed: {error}")

    if not attempts:
        raise RuntimeError("All cloud OCR attempts failed. " + " | ".join(errors))

    ranked = sorted(
        attempts,
        key=lambda item: score_ocr_result(
            item["lines"], item["rawText"], float(item["averageConfidence"])
        ),
        reverse=True,
    )
    best = ranked[0]
    if not best["lines"] and not str(best["rawText"] or "").strip():
        raise RuntimeError(
            "No readable text detected in image. Use a photo/screenshot that contains ingredient text."
        )
    source = f"cloud OCR (OCR.Space engine {best['engine']})"
    structured = extract_structured_ingredients(best["lines"])
    return {
        "ok": True,
        "source": source,
        "lines": best["lines"],
        "rawText": best["rawText"],
        "averageConfidence": best["averageConfidence"],
        "ingredients": structured["ingredients"],
        "droppedLines": structured["droppedLines"],
        "parseMeta": structured["metrics"],
        "meta": {
            "engine": best["engine"],
            "elapsedMs": best["elapsedMs"],
            "attemptedEngines": [item["engine"] for item in attempts],
            "errors": errors,
        },
    }


MEAL_ANALYSIS_PROMPT = """You are a professional chef and food analyst. Analyze this photo of a finished meal or dish.

Respond with ONLY valid JSON in this exact format (no markdown, no explanation):
{
  "name": "Dish Name",
  "description": "Brief 1-2 sentence description of the dish",
  "cuisine": "Type of cuisine (e.g. Mexican, Italian, American)",
  "servings": 4,
  "prepTime": "15 minutes",
  "cookTime": "25 minutes",
  "ingredients": [
    {"name": "ingredient name", "quantity": "1", "unit": "cup"}
  ],
  "steps": [
    {"step": 1, "instruction": "Detailed step with temperature and timing", "temperature": "400°F (200°C)" or null, "duration": "10 minutes" or null}
  ]
}

Rules:
- List ALL visible and likely ingredients with specific quantities and units
- Generate 6-15 detailed cooking steps
- Include temperatures in °F with °C in parentheses where applicable
- Include timing for each step where applicable
- Be specific about measurements (cups, tbsp, tsp, oz, lb, etc.)
"""


def analyze_meal_image(image_data_url: str) -> dict[str, Any]:
    """Send a meal photo to OpenAI Vision API and get a structured recipe back."""
    api_key = OPENAI_API_KEY.strip()
    if not api_key:
        raise RuntimeError(
            "OPENAI_API_KEY environment variable is required for meal analysis. "
            "Set it before starting the proxy server."
        )

    body = json.dumps({
        "model": "gpt-4o",
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": MEAL_ANALYSIS_PROMPT},
                    {"type": "image_url", "image_url": {"url": image_data_url, "detail": "high"}},
                ],
            }
        ],
        "max_tokens": 3000,
        "temperature": 0.3,
    }).encode("utf-8")

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    if OPENAI_PROJECT_ID.strip():
        headers["OpenAI-Project"] = OPENAI_PROJECT_ID.strip()

    request = urllib.request.Request(
        OPENAI_API_URL,
        data=body,
        method="POST",
        headers=headers,
    )

    max_retries = 3
    result = None
    for attempt in range(max_retries):
        try:
            with urllib.request.urlopen(request, timeout=OPENAI_TIMEOUT_SECONDS) as response:
                result = json.loads(response.read().decode("utf-8", errors="replace"))
            break
        except urllib.error.HTTPError as http_err:
            if http_err.code == 429 and attempt < max_retries - 1:
                wait = (attempt + 1) * 5          # 5s, 10s, 15s
                body_text = http_err.read().decode("utf-8", errors="replace")
                print(f"[ocr_proxy] OpenAI 429 rate-limit, retrying in {wait}s (attempt {attempt + 1}/{max_retries})… {body_text[:200]}", flush=True)
                time.sleep(wait)
                # Rebuild request since the body stream was consumed
                request = urllib.request.Request(
                    OPENAI_API_URL,
                    data=body,
                    method="POST",
                    headers=headers,
                )
            else:
                err_body = http_err.read().decode("utf-8", errors="replace")
                raise RuntimeError(
                    f"OpenAI API error {http_err.code}: {err_body[:500]}"
                ) from http_err

    if result is None:
        raise RuntimeError("OpenAI API failed after all retries")

    content = result["choices"][0]["message"]["content"]

    # Strip markdown code fences if present
    if "```json" in content:
        content = content.split("```json")[1].split("```")[0]
    elif "```" in content:
        content = content.split("```")[1].split("```")[0]

    recipe_data = json.loads(content.strip())
    return recipe_data


class OCRProxyHandler(BaseHTTPRequestHandler):
    def _set_headers(self, status_code: int = 200) -> None:
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS, GET")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_OPTIONS(self) -> None:  # noqa: N802
        self._set_headers(204)

    def do_GET(self) -> None:  # noqa: N802
        if self.path.rstrip("/") in ("", "/health"):
            decay_service, decay_error = get_decay_service()
            self._set_headers(200)
            self.wfile.write(
                json.dumps(
                    {
                        "ok": True,
                        "service": "ocr_proxy",
                        "host": HOST,
                        "port": PORT,
                        "endpoints": ["/ocr", "/analyze-meal", "/decay", "/import-recipe-url"],
                        "hasOpenAIKey": bool(OPENAI_API_KEY.strip()),
                        "decayReady": decay_service is not None,
                        "decayError": decay_error,
                    }
                ).encode("utf-8")
            )
            return

        self._set_headers(404)
        self.wfile.write(json.dumps({"ok": False, "error": "Not found"}).encode("utf-8"))

    def _read_json_body(self) -> tuple[dict[str, Any] | None, str | None]:
        """Read and parse JSON body. Returns (payload, error_message)."""
        content_length = int(self.headers.get("Content-Length", "0"))
        if content_length <= 0:
            return None, "Missing request body"
        body = self.rfile.read(content_length)
        try:
            return json.loads(body.decode("utf-8")), None
        except json.JSONDecodeError:
            return None, "Invalid JSON body"

    def do_POST(self) -> None:  # noqa: N802
        path = self.path.rstrip("/")

        if path == "/analyze-meal":
            self._handle_analyze_meal()
            return
        if path == "/decay":
            self._handle_decay()
            return
        if path == "/import-recipe-url":
            self._handle_import_recipe_url()
            return

        if path != "/ocr":
            self._set_headers(404)
            self.wfile.write(json.dumps({"ok": False, "error": "Not found"}).encode("utf-8"))
            return

        payload, error = self._read_json_body()
        if error:
            self._set_headers(400)
            self.wfile.write(json.dumps({"ok": False, "error": error}).encode("utf-8"))
            return

        image_data_url = str(payload.get("imageDataUrl") or "").strip()
        if not image_data_url:
            self._set_headers(400)
            self.wfile.write(json.dumps({"ok": False, "error": "imageDataUrl is required"}).encode("utf-8"))
            return

        try:
            result = run_cloud_ocr(image_data_url)
            self._set_headers(200)
            self.wfile.write(json.dumps(result).encode("utf-8"))
        except Exception as error:  # noqa: BLE001
            self._set_headers(502)
            self.wfile.write(
                json.dumps(
                    {
                        "ok": False,
                        "error": str(error),
                    }
                ).encode("utf-8")
            )

    def _handle_analyze_meal(self) -> None:
        """Handle POST /analyze-meal — AI meal identification."""
        payload, error = self._read_json_body()
        if error:
            self._set_headers(400)
            self.wfile.write(json.dumps({"ok": False, "error": error}).encode("utf-8"))
            return

        image_data_url = str(payload.get("imageDataUrl") or "").strip()
        if not image_data_url:
            self._set_headers(400)
            self.wfile.write(json.dumps({"ok": False, "error": "imageDataUrl is required"}).encode("utf-8"))
            return

        try:
            start = time.time()
            recipe_data = analyze_meal_image(image_data_url)
            elapsed_ms = int((time.time() - start) * 1000)
            self._set_headers(200)
            self.wfile.write(
                json.dumps(
                    {
                        "ok": True,
                        "source": "OpenAI GPT-4o Vision",
                        "elapsedMs": elapsed_ms,
                        **recipe_data,
                    }
                ).encode("utf-8")
            )
        except Exception as error:  # noqa: BLE001
            self._set_headers(502)
            self.wfile.write(
                json.dumps({"ok": False, "error": str(error)}).encode("utf-8")
            )

    def _handle_decay(self) -> None:
        """Handle POST /decay — ML pantry decay prediction."""
        payload, error = self._read_json_body()
        if error:
            self._set_headers(400)
            self.wfile.write(json.dumps({"ok": False, "error": error}).encode("utf-8"))
            return

        required = [
            "item_category",
            "quantity_oz",
            "household_size",
            "meals_per_week",
            "is_staple",
        ]
        missing = [key for key in required if payload.get(key) in (None, "")]
        if missing:
            self._set_headers(400)
            self.wfile.write(
                json.dumps({"ok": False, "error": f"Missing fields: {', '.join(missing)}"}).encode("utf-8")
            )
            return

        service, service_error = get_decay_service()
        if service_error or service is None:
            self._set_headers(502)
            self.wfile.write(
                json.dumps({"ok": False, "error": service_error or "ML service unavailable"}).encode("utf-8")
            )
            return

        try:
            result = service.predict(payload)
            # Prediction is logged to SQLite via service.predict() — no secondary log needed
            self._set_headers(200)
            self.wfile.write(json.dumps({"ok": True, "result": result}).encode("utf-8"))
        except Exception as error:  # noqa: BLE001
            self._set_headers(502)
            self.wfile.write(json.dumps({"ok": False, "error": str(error)}).encode("utf-8"))

    def _handle_import_recipe_url(self) -> None:
        """Handle POST /import-recipe-url for backend-assisted recipe URL imports."""
        payload, error = self._read_json_body()
        if error:
            self._set_headers(400)
            self.wfile.write(json.dumps({"ok": False, "error": error}).encode("utf-8"))
            return

        source_url = clean_line(str(payload.get("url") or ""))
        if not source_url:
            self._set_headers(400)
            self.wfile.write(json.dumps({"ok": False, "error": "url is required"}).encode("utf-8"))
            return

        try:
            result = import_recipe_from_url(source_url)
            self._set_headers(200)
            self.wfile.write(json.dumps({"ok": True, "result": result}).encode("utf-8"))
        except urllib.error.HTTPError as http_error:
            self._set_headers(502)
            self.wfile.write(
                json.dumps({"ok": False, "error": f"URL fetch failed with HTTP {http_error.code}"}).encode("utf-8")
            )
        except urllib.error.URLError as url_error:
            self._set_headers(502)
            self.wfile.write(
                json.dumps({"ok": False, "error": f"URL fetch failed: {url_error.reason}"}).encode("utf-8")
            )
        except Exception as import_error:  # noqa: BLE001
            self._set_headers(502)
            self.wfile.write(json.dumps({"ok": False, "error": str(import_error)}).encode("utf-8"))


def main() -> None:
    server = ThreadingHTTPServer((HOST, PORT), OCRProxyHandler)
    print(f"[ocr_proxy] listening on http://{HOST}:{PORT}", flush=True)
    print("[ocr_proxy] endpoints: POST /ocr, POST /analyze-meal, POST /decay, POST /import-recipe-url, GET /health", flush=True)
    if OPENAI_API_KEY.strip():
        print("[ocr_proxy] OpenAI API key detected — meal analysis enabled", flush=True)
    else:
        print("[ocr_proxy] No OPENAI_API_KEY — meal analysis will use demo mode only", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
