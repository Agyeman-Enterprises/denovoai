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
