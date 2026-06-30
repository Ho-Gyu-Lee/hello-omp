#requires -version 5
# omp portable setup - Windows (PowerShell 5.1+)
# Deploy order: 1) role-based models  2) global rules (AGENTS.md)  3) OKF bundle  4) agents
# Idempotent: safe to re-run. Honors PI_CODING_AGENT_DIR via `omp config path`.
$ErrorActionPreference = 'Stop'
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$trimChars = [char[]]@('\', '/')
$scriptFull = [System.IO.Path]::GetFullPath($ScriptDir).TrimEnd($trimChars)
$envConfigDir = [Environment]::GetEnvironmentVariable('PI_CODING_AGENT_DIR')
if (-not [string]::IsNullOrWhiteSpace($envConfigDir)) {
  $envConfigFull = [System.IO.Path]::GetFullPath($envConfigDir).TrimEnd($trimChars)
  if ([string]::Equals($scriptFull, $envConfigFull, [System.StringComparison]::OrdinalIgnoreCase)) {
    Write-Error "refusing to use setup repo root as omp config dir; set PI_CODING_AGENT_DIR to a separate directory"
    exit 1
  }
}

# --- preflight ---
if (-not (Get-Command omp -ErrorAction SilentlyContinue)) {
  Write-Error "omp not found on PATH. Install: irm https://omp.sh/install.ps1 | iex"
  exit 1
}
$ConfigDir = (omp config path).Trim()
if ([string]::IsNullOrWhiteSpace($ConfigDir)) { Write-Error "could not resolve omp config dir"; exit 1 }
$configFull = [System.IO.Path]::GetFullPath($ConfigDir).TrimEnd($trimChars)
if ([string]::Equals($scriptFull, $configFull, [System.StringComparison]::OrdinalIgnoreCase)) {
  Write-Error "refusing to use setup repo root as omp config dir; set PI_CODING_AGENT_DIR to a separate directory"
  exit 1
}
New-Item -ItemType Directory -Force $ConfigDir | Out-Null
Write-Host "omp config dir: $ConfigDir"
# absolute OKF path (slash-normalized) injected into AGENTS.md/agents so agents read it from any cwd
$okfAbs = (Join-Path $ConfigDir 'okf') -replace '\\', '/'
$okfSourceAbs = (Join-Path $ScriptDir 'okf') -replace '\\', '/'
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
function Set-OkfPath($path) {
  $c = ((Get-Content -Raw -Encoding UTF8 $path) -replace '__OKF_DIR__', $okfAbs) -replace '__OKF_SOURCE_DIR__', $okfSourceAbs
  [System.IO.File]::WriteAllText($path, $c, $utf8NoBom)
}

# --- 1) role-based models ---
Write-Host "[1/4] applying model settings..."
$settings = Join-Path $ScriptDir 'config\settings.conf'
foreach ($line in Get-Content -LiteralPath $settings) {
  $t = $line.Trim()
  if ($t -eq '' -or $t.StartsWith('#')) { continue }
  $parts = $t -split '\s+', 2
  if ($parts.Count -lt 2) { continue }
  $key = $parts[0]
  # PowerShell 5.1 strips inner double-quotes when passing to a native exe; escape them as \"
  $value = $parts[1] -replace '"', '\"'
  & omp config set $key $value | Out-Null
  Write-Host "  set $key"
}

# --- 2) global rules ---
Write-Host "[2/4] deploying global rules (AGENTS.md)..."
$agentsMd = Join-Path $ConfigDir 'AGENTS.md'
if ((Test-Path $agentsMd) -and -not (Test-Path "$agentsMd.bak")) { Copy-Item $agentsMd "$agentsMd.bak" -Force }
Copy-Item (Join-Path $ScriptDir 'rules\AGENTS.md') $agentsMd -Force
Set-OkfPath $agentsMd

# --- 3) OKF bundle (clean redeploy of the managed bundle) ---
Write-Host "[3/4] deploying OKF bundle..."
$okfDst = Join-Path $ConfigDir 'okf'
if (Test-Path $okfDst) { Remove-Item $okfDst -Recurse -Force }
Copy-Item (Join-Path $ScriptDir 'okf') $okfDst -Recurse -Force
# conformance: every non-reserved .md must start with YAML frontmatter
$bad = 0
Get-ChildItem $okfDst -Recurse -Filter *.md | Where-Object { $_.Name -notin 'index.md', 'log.md' } | ForEach-Object {
  if ((Get-Content -Encoding UTF8 -TotalCount 1 $_.FullName) -ne '---') { Write-Host "  WARN: OKF concept missing frontmatter: $($_.FullName)"; $bad++ }
}
if ($bad -eq 0) { Write-Host "  OKF conformance OK" }

# --- 4) custom agents (optional; built-in agents are used as-is, models via roles) ---
Write-Host "[4/4] deploying custom agents (if any)..."
$srcAgents = @(Get-ChildItem (Join-Path $ScriptDir 'agents') -Filter *.md -ErrorAction SilentlyContinue)
if ($srcAgents.Count -gt 0) {
  $agentsDst = Join-Path $ConfigDir 'agents'
  New-Item -ItemType Directory -Force $agentsDst | Out-Null
  $srcAgents | ForEach-Object {
    $dst = Join-Path $agentsDst $_.Name
    Copy-Item $_.FullName $dst -Force
    Set-OkfPath $dst
  }
  Write-Host "  deployed $($srcAgents.Count) custom agent(s)"
} else {
  Write-Host "  none - using omp built-in agents (models via roles)"
}

Write-Host ""
Write-Host "done. verifying modelRoles:"
omp config get modelRoles
