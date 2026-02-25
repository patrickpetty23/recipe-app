param(
  [string]$Root = "."
)

$required = @(
  "aiDocs/prd.md",
  "aiDocs/mvp.md",
  "aiDocs/architecture.md",
  "aiDocs/roadmap.md",
  "aiDocs/context.md",
  "aiDocs/coding-style.md",
  "aiDocs/system-understanding.md",
  "aiDocs/problem-identification.md",
  "aiDocs/customer-focus.md",
  "aiDocs/founding-hypothesis.md",
  "aiDocs/falsification-test.md",
  "aiDocs/differentiation-2x2.md",
  "aiDocs/success-failure-plan.md",
  "aiDocs/customer-interaction.md",
  "aiDocs/system-architecture-leverage.md",
  "aiDocs/evidence/customer-conversation-u1.md",
  "aiDocs/evidence/customer-conversation-u2.md",
  "aiDocs/evidence/customer-conversation-u3.md",
  "aiDocs/evidence/interview-notes.md",
  "aiDocs/debugging.md",
  "aiDocs/rubric-deliverables.md",
  "presentation/RecipeScanner_Midterm_Presentation.pptx",
  "demo/mobileview/index.html",
  "demo/mobileview/app.js",
  "demo/mobileview/styles.css",
  "scripts/ocr_proxy_server.py",
  "ios/RecipeScannerApp/README.md",
  "README.md"
)

$missing = @()
foreach ($file in $required) {
  $path = Join-Path $Root $file
  if (-not (Test-Path $path)) {
    $missing += $file
  }
}

if ($missing.Count -gt 0) {
  Write-Error "Missing required deliverables:`n$($missing -join "`n")"
  exit 1
}

Write-Host "All required rubric deliverable files are present."
exit 0
