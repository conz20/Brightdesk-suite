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
- Downloads the official GitHub Actions Windows x64 runner v2.338.2.
- Verifies the downloaded archive against GitHub's published SHA-256 digest.
- Installs the runner under C:\actions-runner.
- Prompts the official GitHub configuration program for a one-time registration token.
- Registers the runner only to Brightdesk-suite and retains GitHub's default labels: self-hosted, Windows and X64.
- Installs and starts the runner as a Windows service.

It does NOT change the Brightdesk release workflow, publish a release, or install Docker, Linux, or development tools.

BEFORE YOU START
----------------
1. Download and extract this ZIP on your Windows gaming PC.
2. Sign in to GitHub in your browser.
3. Open this exact page:
   https://github.com/conz20/Brightdesk-suite/settings/actions/runners/new
4. Select Windows and x64.
5. Leave that page open. GitHub will show a short-lived registration token as part of its setup instructions. It expires after one hour.

RUN THE SETUP
-------------
1. Double-click Start-Brightdesk-Windows-Runner.cmd.
2. Approve the Windows User Account Control prompt.
3. Read the security note and type REGISTER when prompted.
4. When the official GitHub runner setup asks for its registration token, paste the token from GitHub into that prompt. Do not paste it into ChatGPT, email, messages, or this README.
5. Follow any remaining prompts from the official GitHub runner setup program. Accept the default Windows service account unless you have a reason to use a dedicated service account.
6. Wait for the setup window to report success.
7. Return to GitHub Settings > Actions > Runners. Confirm Brightdesk-Windows-PC appears as Idle/Online.

IMPORTANT SECURITY NOTES
------------------------
A self-hosted runner executes repository workflow code on your PC. Keep it attached only to the private Brightdesk-suite repository. Do not use it for public repositories or for code from people you do not trust. Keep normal Windows security protections enabled. The runner service can start automatically when Windows starts.

The one-time registration token is needed only to register the runner. GitHub says these tokens expire after one hour. The official setup prompt may display what you type; do not screenshot or share that window while entering the token. Never send the token to ChatGPT or anyone else.

AFTER REGISTRATION
------------------
Registration alone does not make Brightdesk use this PC. The Windows job in the release workflow must be updated to target the runner labels:
self-hosted, Windows, X64

That workflow change is intentionally not included in this setup package. First confirm the runner is Idle/Online in GitHub. Then the workflow can be changed and tested separately.

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
