# install-enforcement-fixed.ps1
# Agyeman Enterprises — Enforcement Installer (Fixed)
# Run from repo root: cd C:\devc\alrtme ; C:\devc\ae-enforcement\install-enforcement-fixed.ps1

$ErrorActionPreference = "Stop"

$RepoRoot = Get-Location
$ScriptDir = "C:\devc\ae-enforcement"
$AppName = Split-Path -Leaf $RepoRoot

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  AE ENFORCEMENT INSTALLER" -ForegroundColor Cyan
Write-Host "  App: $AppName" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

# Check git repo
if (-not (Test-Path (Join-Path $RepoRoot ".git"))) {
    Write-Host "ERROR: Not a git repository" -ForegroundColor Red
    exit 1
}

# Create directories
@("scripts", "scripts/hooks", ".claude", "e2e/specs") | ForEach-Object {
    $Path = Join-Path $RepoRoot $_
    if (-not (Test-Path $Path)) {
        New-Item -ItemType Directory -Path $Path -Force | Out-Null
        Write-Host "  [created] $_" -ForegroundColor Green
    }
}

# Create run-gate.ps1 (Windows version)
$RunGate = @'
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
$Bad = Get-ChildItem app -Recurse -Include *.ts,*.tsx | Select-String "TODO(?!\(phase-\d+\))|FIXME|PLACEHOLDER" | Select-Object -First 1
if ($Bad) { Fail "Found in $($Bad.Filename)" }
Ok "Clean code"

# Passed
date > .claude/GATE_PASSED
Write-Host "`nALL GATES PASSED" -ForegroundColor Green
'@

Set-Content -Path (Join-Path $RepoRoot "scripts/run-gate.ps1") -Value $RunGate
Write-Host "  [created] scripts/run-gate.ps1" -ForegroundColor Green

# Create pre-commit hook
$PreCommit = @'
#!/bin/sh
# AE Enforcement Pre-Commit Hook

if [ ! -f .claude/OO_ACTIVE ]; then
    if [ ! -f ../.ae-enforcement/OO_ACTIVE ]; then
        if [ ! -f ../../.ae-enforcement/OO_ACTIVE ]; then
            echo "ERROR: OO SUPERVISION NOT ACTIVE"
            echo "Invoke Oculus Omnividens before committing."
            exit 1
        fi
    fi
fi

if [ ! -f .claude/PLAN_APPROVED ]; then
    echo "ERROR: No PLAN_APPROVED"
    exit 1
fi

if [ ! -f .claude/GATE_PASSED ]; then
    echo "ERROR: Gates not passed. Run: ./scripts/run-gate.ps1"
    exit 1
fi

exit 0
'@

Set-Content -Path (Join-Path $RepoRoot "scripts/hooks/pre-commit") -Value $PreCommit
Copy-Item -Path (Join-Path $RepoRoot "scripts/hooks/pre-commit") -Destination (Join-Path $RepoRoot ".git/hooks/pre-commit") -Force
Write-Host "  [installed] .git/hooks/pre-commit" -ForegroundColor Green

# Install oculus-omnividens skill
$SkillSrc = Join-Path $ScriptDir "skills/oculus-omnividens"
$SkillDst = Join-Path $RepoRoot ".claude/skills/oculus-omnividens"

if (Test-Path $SkillSrc) {
    New-Item -ItemType Directory -Path $SkillDst -Force | Out-Null
    Copy-Item -Path "$SkillSrc\*" -Destination $SkillDst -Recurse -Force
    Write-Host "  [installed] oculus-omnividens skill" -ForegroundColor Magenta
}

# Create OO_ACTIVATION mandatory script
$OOActivator = @'
# OO_ACTIVATE.ps1
# MANDATORY: Run this before any AI coding session

$OO_MARKER = ".claude/OO_ACTIVE"

if (Test-Path $OO_MARKER) {
    Write-Host "OO already active" -ForegroundColor Green
    Get-Content $OO_MARKER | Select-String "STATUS|SUPERVISION"
    exit 0
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  INVOKING OCULUS OMNIVIDENS" -ForegroundColor Cyan
Write-Host "  INCIDENT COMMAND ACTIVATION" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

$Content = @"
OO_SUPERVISION=ACTIVE
ACTIVATED=$(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
MACHINE=$env:COMPUTERNAME
STATUS=INCIDENT_COMMAND_ACTIVE
BUILDER_MAY_NOT_SELF_CERTIFY=true
NO_ESCAPE_HATCH=true
"@

Set-Content -Path $OO_MARKER -Value $Content
Write-Host "`nOO ACTIVATED" -ForegroundColor Green
Write-Host "Builder is supervised. No self-certification allowed." -ForegroundColor Yellow
'@

Set-Content -Path (Join-Path $RepoRoot "OO_ACTIVATE.ps1") -Value $OOActivator
Write-Host "  [created] OO_ACTIVATE.ps1 (run before coding)" -ForegroundColor Green

# Create CLAUDE.md if missing
$ClaudeMd = @'
# CLAUDE.md — MANDATORY CONTRACT
# READ BEFORE TOUCHING ANY CODE

## OO MANDATE
Oculus Omnividens (OO) MUST be active before any work.
Run: .\OO_ACTIVATE.ps1

## NO SELF-CERTIFICATION
Builder does NOT issue PASS verdicts.
OO issues verdicts. Builder complies.

## WORKFLOW
1. Read relevant files
2. Write PLAN.md
3. Get approval → creates .claude/PLAN_APPROVED
4. Execute
5. Run gates → creates .claude/GATE_PASSED
6. OO inspects and issues verdict

## BLOCKED ACTIONS
- No commits without OO_ACTIVE
- No commits without PLAN_APPROVED
- No commits without GATE_PASSED
- No self-issued verdicts

## UNBREAKABLE
- Read schema before DB changes
- No TODO/FIXME in production
- No stub functions
- No hardcoded mock data
'@

Set-Content -Path (Join-Path $RepoRoot "CLAUDE.md") -Value $ClaudeMd -Force
Write-Host "  [created] CLAUDE.md" -ForegroundColor Green

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "  ENFORCEMENT INSTALLED" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host ""
Write-Host "MANDATORY: Run before every coding session:" -ForegroundColor Yellow
Write-Host "  .\OO_ACTIVATE.ps1" -ForegroundColor White
Write-Host ""
