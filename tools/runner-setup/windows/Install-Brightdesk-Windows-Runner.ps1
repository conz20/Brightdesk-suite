[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

$Owner = 'conz20'
$RepositoryName = 'Brightdesk-suite'
$RepositoryUrl = "https://github.com/$Owner/$RepositoryName"
$RunnerVersion = '2.338.2'
$RunnerFileName = "actions-runner-win-x64-$RunnerVersion.zip"
$RunnerDownloadUrl = "https://github.com/actions/runner/releases/download/v$RunnerVersion/$RunnerFileName"
$ExpectedSha256 = 'a1f17aa987fc8158bc7521d284912267a0d01b7c2c4684b33c86783b5e8221cc'
$InstallDirectory = 'C:\actions-runner'
$RunnerName = 'Brightdesk-Windows-PC'
$RunnersEndpoint = "repos/$Owner/$RepositoryName/actions/runners?per_page=100"
$RegistrationEndpoint = "repos/$Owner/$RepositoryName/actions/runners/registration-token"

function Test-IsAdministrator {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = [Security.Principal.WindowsPrincipal]::new($identity)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

if (-not (Test-IsAdministrator)) {
    Write-Host 'Brightdesk needs administrator permission to install its Windows runner service.' -ForegroundColor Yellow
    Write-Host 'Windows will ask you to approve this with its normal User Account Control prompt.'
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
$archivePath = $null
$tempDirectory = $null
$registrationToken = $null
try {
    Write-Host ''
    Write-Host 'BRIGHTDESK WINDOWS RUNNER SETUP' -ForegroundColor Cyan
    Write-Host 'This adds this PC as a private GitHub Actions runner for Brightdesk Suite.'
    Write-Host 'It installs Git for Windows and GitHub CLI only if they are missing.'
    Write-Host 'GitHub sign-in stays on this PC. The runner token is requested automatically.'
    Write-Host ''

    if ($env:OS -ne 'Windows_NT') {
        throw 'This setup package is for Windows only.'
    }
    if (-not [Environment]::Is64BitOperatingSystem -or $env:PROCESSOR_ARCHITECTURE -notin @('AMD64', 'x86_64')) {
        throw 'This package requires 64-bit Intel/AMD Windows (x64).'
    }

    Write-Host 'A self-hosted runner can run code from this private Brightdesk repository.' -ForegroundColor Yellow
    Write-Host 'Keep it attached only to Brightdesk-suite. Do not attach it to public repositories.' -ForegroundColor Yellow
    Write-Host ''
    $confirmation = Read-Host 'Type REGISTER to continue, or press Enter to cancel'
    if ($confirmation -cne 'REGISTER') {
        Write-Host 'Setup cancelled. No runner was registered and no software was installed.' -ForegroundColor Yellow
        exit 0
    }

    $wingetCommand = Get-Command winget.exe -ErrorAction SilentlyContinue
    if ($null -eq $wingetCommand) {
        throw 'Windows Package Manager (winget) was not found. Install or update Microsoft App Installer from the Microsoft Store, then run this same setup file again.'
    }

    $gitCommand = Get-Command git.exe -ErrorAction SilentlyContinue
    $bashCommand = Get-Command bash.exe -ErrorAction SilentlyContinue
    if ($null -eq $gitCommand -or $null -eq $bashCommand) {
        Write-Host 'Installing Git for Windows (required for checkout and Windows Bash build steps)...' -ForegroundColor Cyan
        & $wingetCommand.Source install --id Git.Git --exact --source winget --accept-source-agreements --accept-package-agreements --silent
        if ($LASTEXITCODE -ne 0) {
            throw "Git for Windows installation failed with winget exit code $LASTEXITCODE."
        }
    }

    $ghCommand = Get-Command gh.exe -ErrorAction SilentlyContinue
    if ($null -eq $ghCommand) {
        Write-Host 'Installing the official GitHub CLI...' -ForegroundColor Cyan
        & $wingetCommand.Source install --id GitHub.cli --exact --source winget --accept-source-agreements --accept-package-agreements --silent
        if ($LASTEXITCODE -ne 0) {
            throw "GitHub CLI installation failed with winget exit code $LASTEXITCODE."
        }
    }

    $gitRoot = Join-Path $env:ProgramFiles 'Git'
    $ghRoot = Join-Path $env:ProgramFiles 'GitHub CLI'
    $machinePath = [Environment]::GetEnvironmentVariable('Path', 'Machine')
    $pathParts = @($machinePath -split ';' | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
    $pathChanged = $false
    foreach ($requiredPath in @((Join-Path $gitRoot 'cmd'), (Join-Path $gitRoot 'bin'), $ghRoot)) {
        if ((Test-Path -LiteralPath $requiredPath) -and -not ($pathParts | Where-Object { $_.TrimEnd('\\') -ieq $requiredPath.TrimEnd('\\') })) {
            $pathParts += $requiredPath
            $pathChanged = $true
        }
    }
    if ($pathChanged) {
        [Environment]::SetEnvironmentVariable('Path', ($pathParts -join ';'), 'Machine')
    }
    $env:Path = ([Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User'))

    $gitCommand = Get-Command git.exe -ErrorAction SilentlyContinue
    $bashCommand = Get-Command bash.exe -ErrorAction SilentlyContinue
    $ghCommand = Get-Command gh.exe -ErrorAction SilentlyContinue
    if ($null -eq $gitCommand -or $null -eq $bashCommand -or $null -eq $ghCommand) {
        throw 'Git, Bash or GitHub CLI is still unavailable after installation. Restart Windows, then run the setup file again.'
    }

    Write-Host 'Checking GitHub CLI sign-in...' -ForegroundColor Cyan
    & $ghCommand.Source auth status --hostname github.com *> $null
    if ($LASTEXITCODE -ne 0) {
        Write-Host 'GitHub sign-in is required. GitHub CLI will open the normal browser/device sign-in flow.' -ForegroundColor Yellow
        & $ghCommand.Source auth login --hostname github.com --git-protocol https --web
        if ($LASTEXITCODE -ne 0) {
            throw 'GitHub sign-in did not complete. Run this setup file again after signing in.'
        }
    }

    $githubUser = (& $ghCommand.Source api user --jq '.login' 2>$null | Out-String).Trim()
    if ($LASTEXITCODE -ne 0) {
        throw 'GitHub CLI could not read the signed-in account.'
    }
    if ($githubUser -cne $Owner) {
        throw "GitHub CLI is signed in as '$githubUser', not '$Owner'. Sign in as conz20, then run this setup file again."
    }

    Write-Host 'Checking for an existing Windows runner registration...' -ForegroundColor Cyan
    $runnersJson = & $ghCommand.Source api $RunnersEndpoint 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw 'GitHub could not list the repository runners. Check that conz20 has administrator access to Brightdesk-suite.'
    }
    $runnerList = ($runnersJson -join [Environment]::NewLine) | ConvertFrom-Json
    $registeredRunner = @($runnerList.runners | Where-Object { $_.name -eq $RunnerName }) | Select-Object -First 1

    if ($null -ne $registeredRunner) {
        if ($registeredRunner.status -eq 'online') {
            Write-Host 'Brightdesk-Windows-PC is already registered and online. No duplicate was created.' -ForegroundColor Green
            exit 0
        }

        $runnerConfig = Join-Path $InstallDirectory '.runner'
        if (Test-Path -LiteralPath $runnerConfig) {
            $existingService = Get-CimInstance -ClassName Win32_Service |
                Where-Object { $_.Name -like 'actions.runner.*' -and $_.Name -like "*$RunnerName*" } |
                Select-Object -First 1
            if ($null -ne $existingService) {
                if ($existingService.State -ne 'Running') {
                    Start-Service -Name $existingService.Name
                }
                $serviceCheck = Get-Service -Name $existingService.Name
                if ($serviceCheck.Status -eq 'Running') {
                    Write-Host 'The existing Brightdesk Windows runner service has been started.' -ForegroundColor Green
                    Write-Host 'Check GitHub Settings > Actions > Runners for Idle/Online.'
                    exit 0
                }
            }
        }
        throw 'Brightdesk-Windows-PC is already registered but is offline, and its local service could not be restarted safely. No duplicate was created. Inspect C:\actions-runner and the GitHub runner entry before changing anything.'
    }

    if (Test-Path -LiteralPath $InstallDirectory) {
        $existingItems = @(Get-ChildItem -LiteralPath $InstallDirectory -Force -ErrorAction Stop)
        if ($existingItems.Count -gt 0) {
            throw "$InstallDirectory already contains files but no matching runner registration was found. Nothing was overwritten. Inspect that folder before trying again."
        }
    }
    else {
        New-Item -ItemType Directory -Path $InstallDirectory -Force | Out-Null
    }

    $tempDirectory = Join-Path ([System.IO.Path]::GetTempPath()) ("brightdesk-windows-runner-" + [guid]::NewGuid().ToString('N'))
    New-Item -ItemType Directory -Path $tempDirectory -Force | Out-Null
    $archivePath = Join-Path $tempDirectory $RunnerFileName

    Write-Host "Downloading the official GitHub Actions runner v$RunnerVersion..."
    Invoke-WebRequest -Uri $RunnerDownloadUrl -OutFile $archivePath -UseBasicParsing

    Write-Host 'Checking the official SHA-256 checksum...'
    $actualSha256 = (Get-FileHash -LiteralPath $archivePath -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($actualSha256 -ne $ExpectedSha256) {
        throw 'The runner download did not match the official SHA-256 checksum. Setup stopped.'
    }

    Write-Host 'Checksum verified. Extracting the runner...'
    Expand-Archive -LiteralPath $archivePath -DestinationPath $InstallDirectory -Force
    Remove-Item -LiteralPath $archivePath -Force
    $archivePath = $null

    $configScript = Join-Path $InstallDirectory 'config.cmd'
    if (-not (Test-Path -LiteralPath $configScript)) {
        throw 'The official runner archive did not contain config.cmd. Setup stopped.'
    }

    Write-Host ''
    Write-Host 'Requesting a short-lived runner registration token from GitHub...' -ForegroundColor Cyan
    $registrationToken = (& $ghCommand.Source api --method POST $RegistrationEndpoint --jq '.token' 2>$null | Out-String).Trim()
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($registrationToken)) {
        throw 'GitHub did not issue a runner registration token. Check the signed-in account and repository administrator access.'
    }

    $configArguments = @(
        '--url', $RepositoryUrl,
        '--token', $registrationToken,
        '--name', $RunnerName,
        '--runnergroup', 'Default',
        '--work', '_work',
        '--runasservice',
        '--unattended'
    )
    $registrationToken = $null

    Write-Host 'Registering Brightdesk-Windows-PC with the private repository...'
    Push-Location -LiteralPath $InstallDirectory
    try {
        & $configScript @configArguments
        $configExitCode = $LASTEXITCODE
    }
    finally {
        Pop-Location
        $configArguments = $null
        Remove-Variable -Name registrationToken -ErrorAction SilentlyContinue
    }
    if ($configExitCode -ne 0) {
        throw "GitHub runner configuration returned exit code $configExitCode. The runner service was not confirmed."
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
    Write-Host 'Default labels: self-hosted, Windows, X64'
    Write-Host 'Git for Windows and GitHub CLI are installed and available to the service.'
    Write-Host 'Confirm it shows Idle/Online in GitHub Settings > Actions > Runners.' -ForegroundColor Green
    Write-Host 'The Brightdesk release workflow already targets self-hosted, Windows and X64.'
}
catch {
    $exitCode = 1
    $registrationToken = $null
    if ($null -ne $archivePath -and (Test-Path -LiteralPath $archivePath)) {
        Remove-Item -LiteralPath $archivePath -Force -ErrorAction SilentlyContinue
    }
    Write-Host ''
    Write-Host "SETUP STOPPED: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host 'No existing runner folder was overwritten. Review the message above before trying again.' -ForegroundColor Yellow
}
finally {
    $registrationToken = $null
    if ($null -ne $tempDirectory -and (Test-Path -LiteralPath $tempDirectory)) {
        Remove-Item -LiteralPath $tempDirectory -Recurse -Force -ErrorAction SilentlyContinue
    }
}

Write-Host ''
Read-Host 'Press Enter to close this window' | Out-Null
exit $exitCode
