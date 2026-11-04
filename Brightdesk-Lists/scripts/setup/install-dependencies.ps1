$ErrorActionPreference = 'Stop'
$Root = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
Set-Location $Root

$NodeCommand = Get-Command node -ErrorAction SilentlyContinue
$NeedsNodeInstall = $true
if ($NodeCommand) { $NeedsNodeInstall = (node --version).Trim() -ne 'v24.22.2' }
if ($NeedsNodeInstall) {
  Write-Host 'Brightdesk requires Node.js 24.22.2. Installing the official, checksum-verified runtime...'
  . (Join-Path $Root 'scripts/install-node24.ps1')
}
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
  throw 'npm was not found after installing Node.js 24.22.2. The Node.js archive must include npm.'
}
node scripts/check-node24.js
if ($LASTEXITCODE -ne 0) { throw 'Exact Node.js runtime verification failed.' }
npm run setup:dev
if ($LASTEXITCODE -ne 0) { throw 'Brightdesk dependency setup or checks failed.' }
