# Windows bootstrap. Uses the local bundle when present; otherwise downloads a pinned release.
[CmdletBinding()]
param([Parameter(ValueFromRemainingArguments = $true)][string[]]$InstallerArgs)
$ErrorActionPreference = 'Stop'
$release = 'v1.0.1'
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw 'Node.js is required. Install Node 22.19+, 24.11+, or 26+ from https://nodejs.org/, then rerun.'
}
if ($PSScriptRoot -and (Test-Path (Join-Path $PSScriptRoot 'skills/rea-website-rebuild/SKILL.md'))) {
    & node (Join-Path $PSScriptRoot 'scripts/install.mjs') @InstallerArgs
    if ($LASTEXITCODE -ne 0) { throw "Installer exited with code $LASTEXITCODE." }
    return
}
$work = Join-Path ([System.IO.Path]::GetTempPath()) ('rea-rebuild-' + [guid]::NewGuid().ToString('N'))
try {
    New-Item -ItemType Directory -Path $work | Out-Null
    $archive = Join-Path $work 'rebuild.zip'
    Invoke-WebRequest -UseBasicParsing -Uri "https://github.com/thedileepkumar-dk/REA-Website-Rebuild/archive/refs/tags/$release.zip" -OutFile $archive
    Expand-Archive -LiteralPath $archive -DestinationPath $work
    $entry = Join-Path $work ("REA-Website-Rebuild-" + $release.Substring(1) + '/scripts/install.mjs')
    & node $entry @InstallerArgs
    if ($LASTEXITCODE -ne 0) { throw "Installer exited with code $LASTEXITCODE." }
} finally {
    Remove-Item -LiteralPath $work -Recurse -Force -ErrorAction SilentlyContinue
}
