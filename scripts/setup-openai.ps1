# One-time setup: save OpenAI API key to .env (and optionally push to Render)
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

Write-Host ""
Write-Host "=== OpenAI API key setup ===" -ForegroundColor Green
Write-Host ""
Write-Host "What is this?"
Write-Host "  A password-like string from OpenAI so this app can generate images and text."
Write-Host "  Get one free/paid at: https://platform.openai.com/api-keys"
Write-Host "  (Sign in -> Create new secret key -> copy sk-... )"
Write-Host ""

$key = Read-Host "Paste your OpenAI API key (starts with sk-)"
if ([string]::IsNullOrWhiteSpace($key)) {
  Write-Host "Cancelled." -ForegroundColor Yellow
  exit 1
}
$key = $key.Trim()

$envPath = Join-Path $root ".env"
$lines = @()
if (Test-Path $envPath) {
  $lines = Get-Content $envPath | Where-Object { $_ -notmatch '^\s*OPENAI_API_KEY\s*=' }
}
$lines += "OPENAI_API_KEY=$key"
$lines | Set-Content $envPath -Encoding utf8
Write-Host "Saved to .env" -ForegroundColor Green

$renderKey = $env:RENDER_API_KEY
if (-not $renderKey -and (Test-Path $envPath)) {
  foreach ($line in Get-Content $envPath) {
    if ($line -match '^\s*RENDER_API_KEY\s*=\s*(.+)$') {
      $renderKey = $matches[1].Trim().Trim('"')
    }
  }
}

if ($renderKey) {
  Write-Host "Updating Render service env (RENDER_API_KEY found)..." -ForegroundColor Cyan
  node "$root\scripts\sync-render-env.mjs"
} else {
  Write-Host ""
  Write-Host "Render: add OPENAI_API_KEY in Dashboard -> your service -> Environment"
  Write-Host "  Or set RENDER_API_KEY in .env and run: node scripts/sync-render-env.mjs"
}

Write-Host ""
Write-Host "Done. Local: npm run dev" -ForegroundColor Green
