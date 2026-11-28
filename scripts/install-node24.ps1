# Install and activate the exact Brightdesk Node.js patch in this PowerShell session.
$ErrorActionPreference = 'Stop'
if ($PSVersionTable.PSEdition -eq 'Desktop') { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 }
$NodeVersion = '24.22.3'
$DistBase = if ($env:BRIGHTDESK_NODE_DIST_URL) { $env:BRIGHTDESK_NODE_DIST_URL.TrimEnd('/') } else { "https://nodejs.org/dist/v$NodeVersion" }
$ToolchainRoot = if ($env:BRIGHTDESK_NODE_HOME) { $env:BRIGHTDESK_NODE_HOME } else { Join-Path $HOME '.brightdesk/toolchains' }
$InstallDir = Join-Path $ToolchainRoot "node-v$NodeVersion"
$Architecture = [System.Runtime.InteropServices.RuntimeInformation]::ProcessArchitecture.ToString().ToLowerInvariant()
if ($Architecture -eq 'x64') { $Architecture = 'x64' }
elseif ($Architecture -eq 'arm64') { $Architecture = 'arm64' }
else { throw "Unsupported CPU architecture: $Architecture. Supported architectures: x64 and arm64." }

$NodeExe = Join-Path $InstallDir 'node.exe'
if ((Test-Path $NodeExe) -and (& $NodeExe --version) -eq "v$NodeVersion") {
  $env:Path = "$InstallDir;$env:Path"
  Write-Host "Node.js $NodeVersion is already installed and active."
  return
}

$Archive = "node-v$NodeVersion-win-$Architecture.zip"
$TempDir = Join-Path ([System.IO.Path]::GetTempPath()) ("brightdesk-node24-" + [guid]::NewGuid().ToString('N'))
$StageDir = Join-Path $ToolchainRoot ('.node-v' + $NodeVersion + '.staging-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Force -Path $TempDir, $ToolchainRoot | Out-Null
try {
  $ArchivePath = Join-Path $TempDir $Archive
  $ChecksumsPath = Join-Path $TempDir 'SHASUMS256.txt'
  Write-Host "Downloading official Node.js $NodeVersion ($Architecture)..."
  Invoke-WebRequest -Uri "$DistBase/$Archive" -OutFile $ArchivePath
  Invoke-WebRequest -Uri "$DistBase/SHASUMS256.txt" -OutFile $ChecksumsPath

  $ChecksumLine = Get-Content $ChecksumsPath | Where-Object {
    $Parts = ($_ -split '\s+')
    $Parts.Count -ge 2 -and $Parts[-1].TrimStart('*') -eq $Archive
  } | Select-Object -First 1
  if (-not $ChecksumLine) { throw "Official checksum manifest does not contain $Archive. Refusing to install an unverified runtime." }
  $ExpectedHash = ($ChecksumLine -split '\s+')[0].ToLowerInvariant()
  $ActualHash = (Get-FileHash -Path $ArchivePath -Algorithm SHA256).Hash.ToLowerInvariant()
  if ($ActualHash -ne $ExpectedHash) { throw "Node.js archive checksum mismatch. Expected $ExpectedHash; received $ActualHash." }

  New-Item -ItemType Directory -Force -Path $StageDir | Out-Null
  Expand-Archive -Path $ArchivePath -DestinationPath $StageDir -Force
  $ExtractedDir = Join-Path $StageDir "node-v$NodeVersion-win-$Architecture"
  if (-not (Test-Path (Join-Path $ExtractedDir 'node.exe'))) { throw 'The Node.js archive did not contain the expected node.exe.' }
  if (Test-Path $InstallDir) { Remove-Item -Recurse -Force $InstallDir }
  Move-Item -Path $ExtractedDir -Destination $InstallDir
  if ((& $NodeExe --version) -ne "v$NodeVersion") { throw 'Installed Node.js version verification failed.' }
  $env:Path = "$InstallDir;$env:Path"
  Write-Host "Node.js $NodeVersion installed, checksum-verified and active in this PowerShell session."
  Write-Host "npm version: $(& (Join-Path $InstallDir 'npm.cmd') --version)"
}
finally {
  if (Test-Path $TempDir) { Remove-Item -Recurse -Force $TempDir }
  if (Test-Path $StageDir) { Remove-Item -Recurse -Force $StageDir }
}
