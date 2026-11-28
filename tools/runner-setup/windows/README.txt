DEPRECATED — RETIRED, DO NOT RUN



***

DEPRECATED — RETIRED, DO NOT RUN

This document describes a former personal-device self-hosted GitHub Actions runner setup. It is no longer supported and must not be followed. Brightdesk now runs all authorised work on GitHub-hosted runners only. Do not install runner software, register a personal computer, start a local runner process or keep a device powered on for Brightdesk. If GitHub-hosted capacity is unavailable, report the blocker; do not use a local or paid runner.

Current rule: see [GitHub-only build and release verification](../../docs/LOCAL-RELEASE-VERIFICATION.md) and the GitHub Actions workflows in the Brightdesk-suite repository.

***

BRIGHTDESK WINDOWS RUNNER SETUP
================================

Purpose
-------
Register your 64-bit Windows 10 or Windows 11 PC as a private GitHub Actions runner for:
https://github.com/conz20/Brightdesk-suite

This allows Brightdesk's Windows build checks to run on your own PC instead of a paid GitHub-hosted Windows machine.

WHAT THIS PACKAGE DOES
----------------------
- Requests the normal Windows administrator approval needed to install a Windows service.
- Installs Git for Windows and GitHub CLI through Windows Package Manager (winget) only if either is missing.
- Uses GitHub CLI's official browser/device sign-in flow; the account must be conz20.
- Requests the short-lived runner registration token automatically through GitHub CLI.
- Checks existing GitHub runner registrations before creating a new one, so it does not create duplicates.
- Downloads the official GitHub Actions Windows x64 runner v2.338.2.
- Verifies the downloaded archive against GitHub's published SHA-256 digest.
- Installs the runner under C:\actions-runner.
- Registers it only to Brightdesk-suite and retains GitHub's default labels: self-hosted, Windows and X64.
- Installs and starts the runner as a Windows service.

You do NOT need to open the runner setup page or copy/paste a registration token. The GitHub CLI sign-in credential stays on this Windows PC. The temporary registration token is requested and used automatically by the installer.

It does NOT change the Brightdesk release workflow, publish a release, or install Docker, Linux, or other development tools.

BEFORE YOU START
----------------
1. Use a 64-bit Windows 10 or Windows 11 PC. The setup uses Windows Package Manager (winget). If the setup says winget is missing, install or update **App Installer** from the Microsoft Store, then run the same file again.
2. Make sure you can sign in to GitHub as **conz20** and that this account has administrator access to the private Brightdesk-suite repository.
3. Download only Start-Brightdesk-Windows-Runner.cmd to your Windows PC:
   https://raw.githubusercontent.com/conz20/Brightdesk-suite/main/tools/runner-setup/windows/Start-Brightdesk-Windows-Runner.cmd

   You do not need to download the PowerShell file separately. The launcher downloads the PowerShell installer automatically from a pinned Brightdesk commit, verifies its SHA-256 checksum, and only then starts it. There is no setup ZIP.

RUN THE SETUP
-------------
1. Double-click Start-Brightdesk-Windows-Runner.cmd.
2. The launcher downloads the pinned PowerShell installer and verifies its SHA-256 checksum. If download or verification fails, setup stops.
3. Approve the Windows User Account Control prompt.
4. Read the security note and type REGISTER when prompted.
5. The installer checks for Git for Windows and GitHub CLI. It installs either one from the official winget source only when missing.
6. If GitHub CLI is not already signed in, it opens GitHub's official browser/device sign-in flow. Follow the on-screen instructions and sign in as **conz20**.
7. The installer requests and uses the one-time runner registration token automatically. You do not need to copy or paste it.
8. Wait for the setup window to report success.
9. Confirm Brightdesk-Windows-PC appears as Idle/Online in GitHub Settings > Actions > Runners.

IMPORTANT SECURITY NOTES
------------------------
A self-hosted runner executes repository workflow code on your PC. Keep it attached only to the private Brightdesk-suite repository. Do not use it for public repositories or for code from people you do not trust. Keep normal Windows security protections enabled. The runner service can start automatically when Windows starts.

GitHub CLI signs in through GitHub's official browser/device flow and keeps its authentication credential on this Windows PC. The setup script uses that local sign-in to request a short-lived registration token for Brightdesk-suite, passes it to the official runner configuration command, and clears the script variable immediately afterwards. The token is not printed or written to a file, and you never need to copy or paste it. Never send GitHub sign-in codes or credentials to ChatGPT or anyone else.

AFTER REGISTRATION
------------------
The Brightdesk release workflow already targets the labels `self-hosted`, `Windows` and `X64`. Once this runner appears as Idle/Online and Git for Windows is available to the runner service, it is eligible to receive the native Windows build job.

No workflow edit is needed after registration. The Windows release job already targets these exact labels.

TROUBLESHOOTING
---------------
- If GitHub says the token expired, return to the runner setup page and generate a fresh token, then restart the setup process only after inspecting C:\actions-runner. Do not delete files blindly.
- If C:\actions-runner already contains files, this package stops rather than overwriting them.
- If Windows blocks the download, stop and check Windows security notifications. Do not disable antivirus or Windows security controls.
- To check whether registration succeeded, open GitHub Settings > Actions > Runners.

OFFICIAL REFERENCES
-------------------
GitHub runner setup:
https://docs.github.com/en/actions/how-tos/manage-runners/self-hosted-runners/add-runners

GitHub runner service:
https://docs.github.com/en/actions/how-tos/manage-runners/self-hosted-runners/configure-the-application

Official runner release and checksums:
https://github.com/actions/runner/releases/tag/v2.338.2

Package version: 1.0
Runner version: 2.338.2
Repository: conz20/Brightdesk-suite
