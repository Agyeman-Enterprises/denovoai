# run-gate.ps1
param([string]$ProjectPath = ".")
$ErrorActionPreference = "Stop"

function Ok($msg) { Write-Host "  [OK] $msg" -ForegroundColor Green }
function Fail($msg) { Write-Host "  [FAIL] $msg" -ForegroundColor Red; exit 1 }

Write-Host ""
Write-Host "RELEASE GATE - $AppName" -ForegroundColor Cyan

Set-Location $ProjectPath

# Gate 1: OO Active
Write-Host "`nGate 1: OO SUPERVISION" -ForegroundColor Yellow
$OO = Test-Path ".claude/OO_ACTIVE" 
if (-not $OO) { $OO = Test-Path "..\.ae-enforcement\OO_ACTIVE" }
if (-not $OO) { $OO = Test-Path "..\..\.ae-enforcement\OO_ACTIVE" }
if (-not $OO) { Fail "OO not active. Invoke Oculus Omnividens first." }
Ok "OO supervising"

# Gate 2: PLAN_APPROVED
Write-Host "`nGate 2: PLAN_APPROVED" -ForegroundColor Yellow
if (-not (Test-Path ".claude/PLAN_APPROVED")) { Fail "No PLAN_APPROVED" }
Ok "Plan approved"

# Gate 3: TypeScript
Write-Host "`nGate 3: TypeScript" -ForegroundColor Yellow
npx tsc --noEmit 2>$null
if ($LASTEXITCODE -ne 0) { Fail "TypeScript errors" }
Ok "TypeScript passes"

# Gate 4: Build
Write-Host "`nGate 4: Build" -ForegroundColor Yellow
npm run build 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) { Fail "Build failed" }
Ok "Build succeeds"

# Gate 5: No TODO/FIXME
Write-Host "`nGate 5: Code Quality" -ForegroundColor Yellow
$Bad = Get-ChildItem src/app -Recurse -Include *.ts,*.tsx | Select-String -CaseSensitive "TODO(?!\(phase-\d+\))|FIXME|PLACEHOLDER" | Select-Object -First 1
if ($Bad) { Fail "Found in $($Bad.Filename)" }
Ok "Clean code"

# Passed
date > .claude/GATE_PASSED
Write-Host "`nALL GATES PASSED" -ForegroundColor Green
