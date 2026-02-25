#!/usr/bin/env bash
set -euo pipefail

required=(
  "aiDocs/prd.md"
  "aiDocs/mvp.md"
  "aiDocs/architecture.md"
  "aiDocs/roadmap.md"
  "aiDocs/context.md"
  "aiDocs/coding-style.md"
  "aiDocs/system-understanding.md"
  "aiDocs/problem-identification.md"
  "aiDocs/customer-focus.md"
  "aiDocs/founding-hypothesis.md"
  "aiDocs/falsification-test.md"
  "aiDocs/differentiation-2x2.md"
  "aiDocs/success-failure-plan.md"
  "aiDocs/customer-interaction.md"
  "aiDocs/system-architecture-leverage.md"
  "aiDocs/evidence/customer-conversation-u1.md"
  "aiDocs/evidence/customer-conversation-u2.md"
  "aiDocs/evidence/customer-conversation-u3.md"
  "aiDocs/evidence/interview-notes.md"
  "aiDocs/debugging.md"
  "aiDocs/rubric-deliverables.md"
  "presentation/RecipeScanner_Midterm_Presentation.pptx"
  "demo/mobileview/index.html"
  "demo/mobileview/app.js"
  "demo/mobileview/styles.css"
  "scripts/ocr_proxy_server.py"
  "ios/RecipeScannerApp/README.md"
  "README.md"
)

missing=()
for file in "${required[@]}"; do
  if [[ ! -f "$file" ]]; then
    missing+=("$file")
  fi
done

if [[ ${#missing[@]} -gt 0 ]]; then
  echo "Missing required deliverables:" >&2
  printf '%s\n' "${missing[@]}" >&2
  exit 1
fi

echo "All required rubric deliverable files are present."
