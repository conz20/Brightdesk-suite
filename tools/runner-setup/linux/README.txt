DEPRECATED — RETIRED, DO NOT RUN



***

DEPRECATED — RETIRED, DO NOT RUN

This document describes a former personal-device self-hosted GitHub Actions runner setup. It is no longer supported and must not be followed. Brightdesk now runs all authorised work on GitHub-hosted runners only. Do not install runner software, register a personal computer, start a local runner process or keep a device powered on for Brightdesk. If GitHub-hosted capacity is unavailable, report the blocker; do not use a local or paid runner.

Current rule: see [GitHub-only build and release verification](../../docs/LOCAL-RELEASE-VERIFICATION.md) and the GitHub Actions workflows in the Brightdesk-suite repository.

***

BRIGHTDESK LINUX RUNNER SETUP (WINDOWS WSL 2)
==============================================

Purpose
-------
Use your Windows 10 or Windows 11 PC as the Linux x64 build runner for:
https://github.com/conz20/Brightdesk-suite

The Linux runner runs inside Ubuntu on Windows Subsystem for Linux 2 (WSL 2).
It is separate from the Windows runner. Brightdesk still builds and verifies
native Windows, macOS and Linux packages independently.

WINDOWS REQUIREMENTS
--------------------
- Windows 10 version 2004 (Build 19041) or later, or Windows 11.
- 64-bit Intel/AMD Windows.
- Hardware virtualisation enabled.
- WSL 2 and Ubuntu 22.04 LTS or Ubuntu 24.04 LTS.
- A normal Windows user account. The Linux runner runs in that user's WSL
  distribution; it is not installed as a Windows service.

Microsoft's current WSL install command supports Windows 10 version 2004
(Build 19041) or later, and Windows 11.

INSTALL UBUNTU WSL 2
--------------------
1. Open Windows PowerShell as Administrator.
2. Run:

   wsl --install -d Ubuntu-24.04

3. Restart Windows if prompted.
4. Open Ubuntu 24.04 from the Start menu.
5. Complete Ubuntu's first-run username and password setup.
6. In PowerShell, confirm that Ubuntu is using WSL 2:

   wsl --list --verbose

   The VERSION column must show 2 for Ubuntu-24.04.

7. If it shows 1, convert it:

   wsl --set-version Ubuntu-24.04 2

You can use Ubuntu 22.04 LTS instead, provided it is running as WSL 2.

PREPARE UBUNTU
--------------
Open the Ubuntu terminal and install the basic tools:

   sudo apt update
   sudo apt install -y ca-certificates curl git gh jq tar findutils procps

Sign in to GitHub CLI:

   gh auth login --hostname github.com

Choose GitHub.com and the browser sign-in method. Complete the browser
approval, then check:

   gh auth status --hostname github.com

The authenticated GitHub account must be conz20 and must have administrator
access to Brightdesk-suite.

REGISTER AND START THE RUNNER
-----------------------------
1. In Ubuntu, go to the Brightdesk-suite repository and download this setup
   file from:

   tools/runner-setup/linux/Install-Brightdesk-Linux-Runner.sh

2. Run it from Ubuntu:

   bash Install-Brightdesk-Linux-Runner.sh

3. Read the repository security warning and type REGISTER to continue.
4. The script downloads GitHub's official Linux x64 runner v2.338.2 and
   checks its SHA-256 digest before extracting it.
5. It requests a short-lived registration token through GitHub CLI. The token
   is not printed or stored in a file by this script.
6. The script registers the runner only to Brightdesk-suite and starts it.
7. Open GitHub Settings > Actions > Runners and confirm it shows
   Idle/Online with the labels self-hosted, Linux and X64.

RUNNER LIFETIME
---------------
- The runner is started inside WSL with the official run.sh process.
- Keep the Ubuntu distribution running while Brightdesk GitHub Actions jobs
  are expected to run.
- If Windows restarts or WSL shuts down, the runner goes offline.
- Open Ubuntu and run the setup script again to restart the already-registered
  runner. The script checks GitHub first and does not create duplicate
  registrations.
- This is intentionally not configured as a Windows service or a scheduled
  task. Do not make WSL auto-start changes without reviewing them first.

SECURITY AND LOCAL FILES
------------------------
A self-hosted runner can execute code from its repository workflows. Keep it
registered only to the private Brightdesk-suite repository. Do not attach it
to public repositories or run code from people you do not trust.

The runner application and its own logs remain in the Ubuntu WSL distribution
under:

   ~/.brightdesk-product-ci-runners/Brightdesk-suite

The job checkout is separate. Brightdesk's post-job cleanup action erases the
checked-out source and build workspace after GitHub's own post-job actions
finish. It does not delete the runner application, runner logs, Ubuntu system
packages, or the WSL distribution itself.

TROUBLESHOOTING
---------------
- If the script says WSL 2 was not detected, run wsl --list --verbose in
  PowerShell and convert Ubuntu to version 2.
- If GitHub CLI is not authenticated as conz20, run gh auth login again.
- If the runner is already registered but offline, run this script again
  inside the same Ubuntu distribution to restart it.
- If the runner directory contains files but GitHub has no matching
  registration, inspect the folder before changing or deleting anything.
- Do not disable Windows Defender, firewall protections or other security
  controls to make the runner connect.

OFFICIAL REFERENCES
-------------------
Microsoft WSL install:
https://learn.microsoft.com/en-us/windows/wsl/install

Microsoft WSL basic commands:
https://learn.microsoft.com/en-us/windows/wsl/basic-commands

GitHub self-hosted runner setup:
https://docs.github.com/en/actions/how-tos/manage-runners/self-hosted-runners/add-runners

GitHub runner v2.338.2 release and SHA-256:
https://github.com/actions/runner/releases/tag/v2.338.2

Runner version: 2.338.2
Repository: conz20/Brightdesk-suite
