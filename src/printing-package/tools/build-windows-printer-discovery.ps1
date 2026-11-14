$ErrorActionPreference = "Stop"

if ($env:OS -ne "Windows_NT") {
    throw "The native Windows printer discovery helper must be built on Windows."
}

$ProgramFilesX86 = [Environment]::GetFolderPath('ProgramFilesX86')
$VsWhere = Join-Path $ProgramFilesX86 'Microsoft Visual Studio\Installer\vswhere.exe'
if (-not (Test-Path -LiteralPath $VsWhere)) {
    throw "Microsoft C++ Build Tools and the Windows SDK are required to build the native Windows printer helper."
}

$VsInstallPath = (& $VsWhere -latest -products '*' -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath 2>$null | Out-String).Trim()
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($VsInstallPath)) {
    throw "Visual Studio C++ Build Tools (x64) were not found. Install the free C++ desktop workload and Windows SDK."
}

$DeveloperCommand = Join-Path $VsInstallPath 'Common7\Tools\VsDevCmd.bat'
if (-not (Test-Path -LiteralPath $DeveloperCommand)) {
    throw "Visual Studio's VsDevCmd.bat was not found in the selected installation."
}

# A self-hosted runner runs as a Windows service, not in an interactive
# Developer PowerShell. Load the official x64 developer environment explicitly.
$EnvironmentOutput = & $env:ComSpec /d /c ('call "' + $DeveloperCommand + '" -no_logo -arch=x64 -host_arch=x64 && set')
if ($LASTEXITCODE -ne 0) {
    throw "Visual Studio could not initialize its x64 compiler environment (exit code $LASTEXITCODE)."
}

foreach ($Line in $EnvironmentOutput) {
    $Separator = $Line.IndexOf('=')
    if ($Separator -le 0) {
        continue
    }

    $Name = $Line.Substring(0, $Separator)
    if ($Name -match '^[A-Za-z_][A-Za-z0-9_]*$') {
        [Environment]::SetEnvironmentVariable($Name, $Line.Substring($Separator + 1), 'Process')
    }
}

$Compiler = Get-Command "cl.exe" -ErrorAction SilentlyContinue
if (-not $Compiler) {
    throw "The Visual Studio developer environment did not expose cl.exe."
}

if ([string]::IsNullOrWhiteSpace($env:WindowsSdkDir) -or [string]::IsNullOrWhiteSpace($env:WindowsSDKVersion)) {
    throw "The Visual Studio environment did not select a Windows SDK."
}
$SdkVersion = $env:WindowsSDKVersion.TrimEnd('\')
$SdkInclude = Join-Path $env:WindowsSdkDir "Include\$SdkVersion"
$SdkLibraries = Join-Path $env:WindowsSdkDir "Lib\$SdkVersion\um\x64"
foreach ($Header in @('um\Windows.h', 'cppwinrt\winrt\Windows.Foundation.h')) {
    if (-not (Test-Path -LiteralPath (Join-Path $SdkInclude $Header))) {
        throw "The selected Windows SDK is missing $Header."
    }
}
foreach ($Library in @('dnsapi.lib', 'windowsapp.lib', 'winspool.lib')) {
    if (-not (Test-Path -LiteralPath (Join-Path $SdkLibraries $Library))) {
        throw "The selected Windows SDK is missing $Library."
    }
}

$RepoRoot = Split-Path -Parent $PSScriptRoot
$NativeDir = Join-Path $RepoRoot "native\windows"
$Source = Join-Path $NativeDir "ipp-printer-discovery.cpp"
$Output = Join-Path $NativeDir "brightdesk-ipp-discovery.exe"
$TempDir = Join-Path ([System.IO.Path]::GetTempPath()) ("brightdesk-printing-" + [Guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Path $TempDir | Out-Null
$Object = Join-Path $TempDir "ipp-printer-discovery.obj"

try {
    & $Compiler.Source /nologo /std:c++17 /EHsc /O2 /W4 /DUNICODE /D_UNICODE "/Fo:$Object" "/Fe:$Output" $Source /link dnsapi.lib windowsapp.lib winspool.lib
    if ($LASTEXITCODE -ne 0) {
        throw "The Windows native printer discovery and WSD pairing helper did not compile (exit code $LASTEXITCODE)."
    }

    & $Output --version
    if ($LASTEXITCODE -ne 0) {
        throw "The Windows printer discovery helper did not start successfully."
    }
} finally {
    if (Test-Path -LiteralPath $TempDir) {
        Remove-Item -LiteralPath $TempDir -Recurse -Force -ErrorAction SilentlyContinue
    }
}
