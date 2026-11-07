[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

$RepositoryUrl = 'https://github.com/connormolloy12/Brightdesk-suite'
$RunnerVersion = '2.338.2'
$RunnerFileName = "actions-runner-win-x64-$RunnerVersion.zip"
$RunnerDownloadUrl = "https://github.com/actions/runner/releases/download/v$RunnerVersion/$RunnerFileName"
$ExpectedSha256 = 'a1f17aa987fc8158bc7521d284912267a0d01b7c2c4684b33c86783b5e8221cc'
$InstallDirectory = 'C:\actions-runner'
$RunnerName = 'Brightdesk-Windows-PC'
$ExtraLabel = 'brightdesk-windows'

function Test-IsAdministrator {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = [Security.Principal.WindowsPrincipal]::new($identity)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

if (-not (Test-IsAdministrator)) {
    Write-Host 'Brightdesk Windows runner setup needs administrator permission to install its Windows service.' -ForegroundColor Yellow
    Write-Host 'Windows will ask you to approve this with a standard User Account Control prompt.'
    try {
        $quotedScript = '"' + $PSCommandPath + '"'
        $elevatedProcess = Start-Process -FilePath "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe" `
            -ArgumentList "-NoLogo -NoProfile -ExecutionPolicy Bypass -File $quotedScript" `
            -Verb RunAs -Wait -PassThru
        exit $elevatedProcess.ExitCode
    }
    catch {
        Write-Host "Administrator approval was not completed: $($_.Exception.Message)" -ForegroundColor Red
        Read-Host 'Press Enter to close this window' | Out-Null
        exit 1
    }
}

$exitCode = 0
try {
    Write-Host ''
    Write-Host 'BRIGHTDESK WINDOWS RUNNER SETUP' -ForegroundColor Cyan
    Write-Host 'This adds this PC as a private GitHub Actions runner for Brightdesk Suite.'
    Write-Host 'It does not change Brightdesk source code or release settings.'
    Write-Host ''

    if ($env:OS -ne 'Windows_NT') {
        throw 'This setup package is for Windows only.'
    }
    if (-not [Environment]::Is64BitOperatingSystem -or $env:PROCESSOR_ARCHITECTURE -notin @('AMD64', 'x86_64')) {
        throw 'This package requires 64-bit Intel/AMD Windows (x64).'
    }

    Write-Host 'The runner can execute code from the private Brightdesk repository.' -ForegroundColor Yellow
    Write-Host 'Keep this runner restricted to Brightdesk-suite. Do not attach it to public repositories.' -ForegroundColor Yellow
    Write-Host ''
    $confirmation = Read-Host 'Type REGISTER to continue, or press Enter to cancel'
    if ($confirmation -cne 'REGISTER') {
        Write-Host 'Setup cancelled. No runner was registered.' -ForegroundColor Yellow
        exit 0
    }

    if (Test-Path -LiteralPath $InstallDirectory) {
        $existingItems = @(Get-ChildItem -LiteralPath $InstallDirectory -Force -ErrorAction Stop)
        if ($existingItems.Count -gt 0) {
            throw "$InstallDirectory already contains files. Nothing was overwritten. Please inspect that folder before trying again."
        }
    }
    else {
        New-Item -ItemType Directory -Path $InstallDirectory -Force | Out-Null
    }

    $archivePath = Join-Path $env:TEMP $RunnerFileName
    if (Test-Path -LiteralPath $archivePath) {
        Remove-Item -LiteralPath $archivePath -Force
    }

    Write-Host "Downloading the official GitHub Actions runner v$RunnerVersion..."
    Invoke-WebRequest -Uri $RunnerDownloadUrl -OutFile $archivePath -UseBasicParsing

    Write-Host 'Checking the official SHA-256 checksum...'
    $actualSha256 = (Get-FileHash -LiteralPath $archivePath -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($actualSha256 -ne $ExpectedSha256) {
        Remove-Item -LiteralPath $archivePath -Force -ErrorAction SilentlyContinue
        throw 'The runner download did not match the official SHA-256 checksum. The archive was deleted and setup stopped.'
    }

    Write-Host 'Checksum verified. Extracting the runner...'
    Expand-Archive -LiteralPath $archivePath -DestinationPath $InstallDirectory -Force
    Remove-Item -LiteralPath $archivePath -Force

    $configScript = Join-Path $InstallDirectory 'config.cmd'
    if (-not (Test-Path -LiteralPath $configScript)) {
        throw 'The official runner archive did not contain config.cmd. Setup stopped.'
    }

    Write-Host ''
    Write-Host 'GitHub runner registration is next.' -ForegroundColor Cyan
    Write-Host 'Paste the one-time registration token into the official GitHub runner prompt.'
    Write-Host 'The token is not included in this script or passed as a command-line argument.' -ForegroundColor Yellow
    Write-Host 'Do not send the token to ChatGPT or anyone else.' -ForegroundColor Yellow
    Write-Host ''

    $configArguments = @(
        '--url', $RepositoryUrl,
        '--name', $RunnerName,
        '--runnergroup', 'Default',
        '--labels', $ExtraLabel,
        '--runasservice'
    )

    Push-Location -LiteralPath $InstallDirectory
    try {
        & $configScript @configArguments
        if ($LASTEXITCODE -ne 0) {
            throw "GitHub runner configuration returned exit code $LASTEXITCODE. The runner service was not confirmed."
        }
    }
    finally {
        Pop-Location
    }

    $service = Get-CimInstance -ClassName Win32_Service |
        Where-Object { $_.Name -like 'actions.runner.*' -and $_.Name -like "*$RunnerName*" } |
        Select-Object -First 1

    if ($null -eq $service) {
        throw 'The runner registered, but its Windows service was not found. Check GitHub Settings > Actions > Runners and Windows Services.'
    }

    if ($service.State -ne 'Running') {
        Start-Service -Name $service.Name
    }

    $confirmedService = Get-Service -Name $service.Name
    if ($confirmedService.Status -ne 'Running') {
        throw 'The runner service was installed but did not reach the Running state.'
    }

    Write-Host ''
    Write-Host 'SUCCESS: the Brightdesk Windows runner service is running.' -ForegroundColor Green
    Write-Host "Runner name: $RunnerName"
    Write-Host "Extra label: $ExtraLabel"
    Write-Host 'Open GitHub Settings > Actions > Runners to confirm that it shows as Idle/Online.'
    Write-Host 'The Windows build workflow still needs to be pointed at this runner before it can use it.' -ForegroundColor Yellow
}
catch {
    $exitCode = 1
    Write-Host ''
    Write-Host "SETUP STOPPED: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host 'No existing runner folder was overwritten. Review the message above before trying again.' -ForegroundColor Yellow
}

Write-Host ''
Read-Host 'Press Enter to close this window' | Out-Null
exit $exitCode
