#requires -version 5
# omp portable setup - Windows (PowerShell 5.1+)
# Deploy order: 1) role-based models  2) global/advisor rules  3) OKF bundle  4) extensions  5) agents  6) commands  7) skills  8) removals + settings check
# Idempotent: safe to re-run. Honors PI_CODING_AGENT_DIR via `omp config path`.
$ErrorActionPreference = 'Stop'
# PowerShell 7.3+ defaults to Windows/Standard native argument passing, which quotes native .exe arguments itself and would double-escape the manual \" below; keep the 5.1 (Legacy) behavior.
$PSNativeCommandArgumentPassing = 'Legacy'
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
if (-not (Get-Command bun -ErrorAction SilentlyContinue)) {
  Write-Error "bun not found on PATH; Bun is required for OKF validation"
  exit 1
}

# Check the newest required setting before any managed setting is changed.
& omp config get title.generator | Out-Null
if ($LASTEXITCODE -ne 0) {
  Write-Error "omp 18.8.0 or newer is required (title.generator setting missing)"
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
& bun (Join-Path $ScriptDir 'scripts\deploy-skills.ts') --check $ConfigDir
if ($LASTEXITCODE -ne 0) { Write-Error "setup path preflight failed"; exit $LASTEXITCODE }
# local knowledge preflight: stops before any change on migration conflicts, invalid local concepts or a detected wipe
& bun (Join-Path $ScriptDir 'scripts\deploy-okf.ts') --check $ConfigDir
if ($LASTEXITCODE -ne 0) { Write-Error "OKF local knowledge preflight failed"; exit $LASTEXITCODE }
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
function Set-OmpSettings([string]$Path) {
  foreach ($line in Get-Content -LiteralPath $Path) {
    $t = $line.Trim()
    if ($t -eq '' -or $t.StartsWith('#')) { continue }
    $parts = $t -split '\s+', 2
    if ($parts.Count -lt 2) { continue }
    $key = $parts[0]
    # PowerShell 5.1 strips inner double-quotes when passing to a native exe; escape them as \"
    $value = $parts[1] -replace '"', '\"'
    & omp config set $key $value | Out-Null
    if ($LASTEXITCODE -ne 0) { Write-Error "failed to set $key"; exit $LASTEXITCODE }
    Write-Host "  set $key"
  }
}

Write-Host "[1/8] applying model settings..."
Set-OmpSettings (Join-Path $ScriptDir 'config\settings.conf')

# --- 2) global/advisor rules ---
Write-Host "[2/8] deploying global/advisor rules (AGENTS.md, WATCHDOG.md)..."
$agentsMd = Join-Path $ConfigDir 'AGENTS.md'
if ((Test-Path $agentsMd) -and -not (Test-Path "$agentsMd.bak")) { Copy-Item $agentsMd "$agentsMd.bak" -Force }
Copy-Item (Join-Path $ScriptDir 'rules\AGENTS.md') $agentsMd -Force
Set-OkfPath $agentsMd
$watchdogMd = Join-Path $ConfigDir 'WATCHDOG.md'
if ((Test-Path $watchdogMd) -and -not (Test-Path "$watchdogMd.bak")) { Copy-Item $watchdogMd "$watchdogMd.bak" -Force }
Copy-Item (Join-Path $ScriptDir 'rules\WATCHDOG.md') $watchdogMd -Force

# --- 3) OKF bundle (validate source, then redeploy public files; local learned/ is preserved) ---
Write-Host "[3/8] validating and deploying OKF bundle..."
$okfSrc = Join-Path $ScriptDir 'okf'
$okfValidator = Join-Path $ScriptDir 'scripts\validate-okf.ts'
& bun $okfValidator $okfSrc
if ($LASTEXITCODE -ne 0) { Write-Error "OKF conformance validation failed"; exit $LASTEXITCODE }
& bun (Join-Path $ScriptDir 'scripts\deploy-okf.ts') $ConfigDir
if ($LASTEXITCODE -ne 0) { Write-Error "OKF deployment failed"; exit $LASTEXITCODE }

# --- 4) extensions (auto-discovered from user agent dir) ---
Write-Host "[4/8] deploying extensions (if any)..."
$extensionsDir = Join-Path $ScriptDir 'extensions'
$srcExtensions = @()
if (Test-Path $extensionsDir) {
  $srcExtensions = @(Get-ChildItem -Path $extensionsDir -File -ErrorAction SilentlyContinue | Where-Object { $_.Extension -in '.js', '.ts' })
}
if ($srcExtensions.Count -gt 0) {
  $extensionsDst = Join-Path $ConfigDir 'extensions'
  New-Item -ItemType Directory -Force $extensionsDst | Out-Null
  $srcExtensions | ForEach-Object {
    Copy-Item $_.FullName (Join-Path $extensionsDst $_.Name) -Force
  }
  Write-Host "  deployed $($srcExtensions.Count) extension(s)"
} else {
  Write-Host "  none"
}


# --- 5) agent overrides/custom agents (optional; built-in agents are default) ---
Write-Host "[5/8] deploying agent overrides/custom agents (if any)..."
$agentsDst = Join-Path $ConfigDir 'agents'
$managedAgents = @('reviewer.md', 'plan.md')
foreach ($managed in $managedAgents) {
  $managedRole = [System.IO.Path]::GetFileNameWithoutExtension($managed)
  $managedMarker = "# source: omp v16.3.8 bundled ${managedRole}; only thinkingLevel changed high -> xhigh."
  $srcManaged = Join-Path (Join-Path $ScriptDir 'agents') $managed
  $dstManaged = Join-Path $agentsDst $managed
  if (-not (Test-Path -LiteralPath $srcManaged) -and (Test-Path -LiteralPath $dstManaged)) {
    $managedLines = Get-Content -LiteralPath $dstManaged -Encoding UTF8
    if ($managedLines -ccontains $managedMarker) {
      Remove-Item -LiteralPath $dstManaged -Force
    }
  }
}
$srcAgents = @(Get-ChildItem (Join-Path $ScriptDir 'agents') -Filter *.md -ErrorAction SilentlyContinue)
if ($srcAgents.Count -gt 0) {
  New-Item -ItemType Directory -Force $agentsDst | Out-Null
  $srcAgents | ForEach-Object {
    $dst = Join-Path $agentsDst $_.Name
    Copy-Item $_.FullName $dst -Force
    Set-OkfPath $dst
  }
  Write-Host "  deployed $($srcAgents.Count) agent file(s)"
} else {
  Write-Host "  none - using omp built-in agents (models via roles)"
}

# --- 6) file slash commands (preserve unrelated user commands) ---
Write-Host "[6/8] deploying commands (if any)..."
$commandsDir = Join-Path $ScriptDir 'commands'
$srcCommands = @()
if (Test-Path -LiteralPath $commandsDir) {
  $srcCommands = @(Get-ChildItem -LiteralPath $commandsDir -File -Filter *.md)
}
if ($srcCommands.Count -gt 0) {
  $commandsDst = Join-Path $ConfigDir 'commands'
  New-Item -ItemType Directory -Force $commandsDst | Out-Null
  $srcCommands | ForEach-Object {
    Copy-Item -LiteralPath $_.FullName -Destination (Join-Path $commandsDst $_.Name) -Force
  }
  Write-Host "  deployed $($srcCommands.Count) command(s)"
} else {
  Write-Host "  none"
}

# --- 7) bundled skills (copy only; no upstream code execution) ---
Write-Host "[7/8] deploying bundled skills..."
& bun (Join-Path $ScriptDir 'scripts\deploy-skills.ts') $ConfigDir
if ($LASTEXITCODE -ne 0) { Write-Error "skill deployment failed"; exit $LASTEXITCODE }

# --- 8) apply removals from the repository and verify settings (records what setup deployed) ---
Write-Host "[8/8] retiring removed managed items and verifying settings..."
& bun (Join-Path $ScriptDir 'scripts\sync-managed.ts') $ConfigDir
if ($LASTEXITCODE -ne 0) { Write-Error "managed item sync failed"; exit $LASTEXITCODE }

Write-Host ""
Write-Host "done. verifying modelRoles:"
omp config get modelRoles
