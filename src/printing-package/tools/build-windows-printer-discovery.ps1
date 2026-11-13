$ErrorActionPreference = "Stop"

if ($env:OS -ne "Windows_NT") {
    throw "The native Windows printer discovery helper must be built on Windows."
}

$Compiler = Get-Command "cl.exe" -ErrorAction SilentlyContinue
if (-not $Compiler) {
    throw "Microsoft C++ Build Tools are required. Run this script from a Visual Studio Developer PowerShell."
}

$RepoRoot = Split-Path -Parent $PSScriptRoot
$NativeDir = Join-Path $RepoRoot "native\windows"
$Source = Join-Path $NativeDir "ipp-printer-discovery.cpp"
$Output = Join-Path $NativeDir "brightdesk-ipp-discovery.exe"
$Object = Join-Path $NativeDir "ipp-printer-discovery.obj"

& $Compiler.Source /nologo /std:c++17 /EHsc /O2 /W4 /DUNICODE /D_UNICODE "/Fo:$Object" "/Fe:$Output" $Source /link dnsapi.lib windowsapp.lib winspool.lib
if ($LASTEXITCODE -ne 0) {
    throw "The Windows native printer discovery and WSD pairing helper did not compile (exit code $LASTEXITCODE)."
}

& $Output --version
if ($LASTEXITCODE -ne 0) {
    throw "The Windows Bonjour discovery helper did not start successfully."
}
