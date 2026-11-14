BRIGHTDESK CUSTOMER-PRODUCT MAC RUNNER SETUP
============================================

Purpose
-------
Register and start one repository-scoped GitHub Actions runner for each of the ten approved Brightdesk customer products on an Apple-silicon Mac. Each runner receives GitHub's normal self-hosted, macOS and ARM64 labels plus the shared `brightdesk-product-ci` label required by the current product workflows.

The approved customer products are exactly:
- Brightdesk-Pages
- Brightdesk-Sheets
- Brightdesk-Decks
- Brightdesk-Notes
- Brightdesk-Database
- Brightdesk-Forms
- Brightdesk-Lists
- Brightdesk-Planner
- Brightdesk-To-Do
- Brightdesk-Workspace

Brightdesk-AI and shared infrastructure repositories are not included. This does not add a customer product or change the approved product count.

BEFORE YOU START
----------------
1. Use an Apple-silicon Mac. This setup is not for Intel Macs, Windows or Linux.
2. Install GitHub CLI (`gh`) from the official GitHub distribution and sign in as `conz20`:
   gh auth login --hostname github.com
3. The signed-in account must have repository administration access to all ten named private product repositories, including permission to register repository-level self-hosted runners.
4. Keep normal macOS security protections enabled. Never send your GitHub CLI credential, sign-in code or runner registration token to ChatGPT or anyone else.
5. A self-hosted runner executes workflow code from its matching private repository. Keep these runners limited to the named private Brightdesk repositories. Do not use them for public repositories or untrusted fork code.

RUN THE SETUP
-------------
From a Brightdesk-suite checkout that contains this helper, run:

   bash tools/runner-setup/macos/Start-Brightdesk-Mac-Product-Runners.sh

Read the security notice and type REGISTER to continue. Press Enter to cancel without registering anything.

NO-TERMINAL OPTION — FINDER APP
-------------------------------
A Finder-launched macOS app is included at:

   tools/runner-setup/macos/Brightdesk-Product-Runner-Setup.app

To use it without opening Terminal:
1. In GitHub, open the Brightdesk-suite branch `chore/product-mac-runners-2026-11-14` and use Code → Download ZIP.
2. Extract the ZIP in Finder. Keep the app bundle beside `Start-Brightdesk-Mac-Product-Runners.sh`; the app calls that sibling script.
3. Double-click `Brightdesk-Product-Runner-Setup.app`.
4. The app checks that GitHub CLI is installed and already authenticated as `conz20`. It stops without changes if either check fails.
5. Review the on-screen warning and choose Register or Cancel. Cancel exits without requesting any runner token.
6. The app runs the setup in the background and displays whether the script completed. It does not open Terminal.

The Finder app does not install GitHub CLI or sign in to GitHub. Those must already be configured for the current macOS user. It adds no repository permissions or secrets. Setup logs are stored with owner-only permissions in:
`~/Library/Logs/Brightdesk/Product-Runner-Setup/`

This draft app bundle is not code-signed or notarised. Do not bypass a macOS security warning unless you have reviewed and approved the exact source in this private repository. The app must remain beside the shell script extracted from the same reviewed branch.

The script:
- Verifies Apple-silicon macOS and confirms GitHub CLI is authenticated as `conz20`.
- Downloads the official GitHub Actions runner v2.338.2 macOS ARM64 archive and checks it against the pinned SHA-256 digest used by the existing Brightdesk Mac runner setup.
- Checks registered online/offline runners and required labels before adding anything. It does not create a duplicate if a matching online or offline product runner already exists.
- Requests a short-lived registration token separately for each product repository using GitHub CLI. The GitHub CLI credential itself is never passed to the runner configurator.
- Configures each runner only for its matching private repository and adds the `brightdesk-product-ci` label.
- Starts configured runners with `nohup`. It does not install a launchd service, elevate privileges or change repository settings.
- Keeps each runner's files and logs under `~/.brightdesk-product-ci-runners/products/<repository>/` with owner-only directory permissions.
- Restarts only a matching registered offline runner whose labels and local configuration match. It refuses to execute or reuse an unregistered existing runner folder, and refuses symbolic links or unexpected paths; inspect and move an unregistered folder aside before retrying.

The helper processes repositories sequentially. The runner registration token is temporary; the script does not print or write it to a file and clears its variable after configuration. The token is necessarily passed to GitHub's official runner configurator during setup.

AFTER SETUP
-----------
Open Settings > Actions > Runners in each product repository. Confirm the corresponding runner is Idle/Online and has all four labels:
- self-hosted
- macOS
- ARM64
- brightdesk-product-ci

A runner process remains active after its terminal window closes. It does not automatically restart after logout or reboot. Rerun this helper after signing in to restart a registered runner when its local installation is intact.

If an existing compatible runner is offline but its local files are not in the product helper's folder, the helper deliberately stops short of creating another registration. Inspect the runner in GitHub Settings > Actions > Runners and restart it from its existing local runner folder instead.

If GitHub CLI does not have the required repository administration access, the script stops. Resolve the access problem through the normal account owner process; do not weaken repository permissions, change visibility or enable paid runners as a workaround.

SHARED-HOST SECURITY BOUNDARY
-----------------------------
All ten runner processes started by this helper run as the same signed-in macOS user. Registering each runner to a separate GitHub repository limits which repository can send jobs to that runner, but it does not create an operating-system security boundary between the runners. Workflow code running under this account may be able to read or change other files that this macOS user can access, including files in the other product runner folders.

Use these runners only for trusted Brightdesk workflow code. Do not attach them to public repositories, accept untrusted fork workflows, or run third-party workflow code on this shared account. For stronger isolation, use separate macOS accounts or separate hosts for different repositories, or use appropriately isolated ephemeral runners, before running code that is not fully trusted.

IMPORTANT LIMITS
----------------
Registering a runner only makes the matching queued workflow eligible to start. It does not prove the workflow passes. Check the exact PR head, all required workflow results, native platform builds and the outstanding physical-printer acceptance separately. These runners do not replace Windows or Linux verification.

OFFICIAL REFERENCES
-------------------
GitHub self-hosted runner setup:
https://docs.github.com/en/actions/how-tos/manage-runners/self-hosted-runners/add-runners

Pinned GitHub Actions runner release:
https://github.com/actions/runner/releases/tag/v2.338.2

Runner version: 2.338.2
Architecture: macOS ARM64
Repository owner: conz20
Customer product count: exactly ten
