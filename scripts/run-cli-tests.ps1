param(
  [string]$Fixtures = "fixtures/parser-fixtures.json"
)

if (-not (Get-Command swift -ErrorAction SilentlyContinue)) {
  Write-Error "Swift toolchain not found. Install Swift (Xcode command line tools) and rerun."
  exit 1
}

Write-Host "Running Swift unit tests..."
swift test
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}

Write-Host "Running parser fixture CLI..."
swift run RecipeCLITest --fixtures $Fixtures
exit $LASTEXITCODE
