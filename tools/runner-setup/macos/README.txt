BRIGHTDESK PRIVATE MAC RUNNER SETUP
===================================

Purpose
-------
Register and start private GitHub Actions runners on an Apple-silicon Mac for the Brightdesk repositories whose Mac checks are waiting for their own repository-scoped runner.

The setup covers these eleven repositories:
- Brightdesk-Common-Actions
- Brightdesk-Developer-Tools
- Brightdesk-Extensions
- Brightdesk-Wiki
- Brightdesk-Release-Tools
- Brightdesk-Services
- Brightdesk-Assets
- Brightdesk-Lists
- Brightdesk-Pages
- Brightdesk-Database
- Brightdesk-Decks

Brightdesk-Lists, Brightdesk-Pages, Brightdesk-Database and Brightdesk-Decks receive the additional label "brightdesk-product-ci" because their quality or installer workflows require it. All runners retain GitHub's normal self-hosted, macOS and ARM64 labels.

BEFORE YOU START
----------------
1. This package is for an Apple-silicon Mac only.
2. Install GitHub CLI (gh) from the official GitHub distribution and sign in as conz20:
   gh auth login --hostname github.com
3. The signed-in GitHub credential must have administrator access to all eleven private repositories, including permission to register repository-level self-hosted runners.
4. Keep normal macOS security protections enabled. Do not send your GitHub CLI credential or a runner token to ChatGPT or anyone else.

RUN THE SETUP
-------------
From the Brightdesk-suite repository root, run:

   bash tools/runner-setup/macos/Start-Brightdesk-Mac-Foundation-Runners.sh

Read the security notice and type REGISTER to continue.

The script:
- Checks that the computer is Apple-silicon macOS and that GitHub CLI is signed in as conz20.
- Downloads the official GitHub Actions runner v2.338.2 for macOS ARM64.
- Verifies the archive against the SHA-256 digest published with the official GitHub release.
- Checks existing runner registrations and required labels before adding anything.
- Uses the authenticated GitHub CLI to request a short-lived registration token separately for each repository. The GitHub CLI credential itself is never passed to the runner configurator.
- Registers each runner only to its matching private Brightdesk repository.
- Starts each configured runner with nohup in the background. No launchd service or administrator elevation is used.
- Reuses the verified, previously extracted runner files left by an interrupted first setup only when they are unconfigured and complete. It refuses to overwrite unexpected or already-configured files and does not create a duplicate when a matching runner is already online.

AFTER SETUP
-----------
Open Settings > Actions > Runners in each repository and confirm the matching runner appears as Idle/Online.

Runner files and runtime logs are kept under:

   ~/.brightdesk-product-ci-runners/<repository>/

The processes continue after the terminal window closes. They do not auto-start after logout or reboot. Run the setup script again after signing in to restart an already-registered runner whose local installation is intact.

If the script says a runner is registered but its folder or labels need inspection, stop and inspect that repository's runner page and the indicated local folder. Do not delete existing runner folders or remove registrations blindly.

If GitHub CLI does not have sufficient repository administration access, the script stops. Resolve the account permission with GitHub before retrying. The script does not change repository permissions, workflow files, repository visibility, branch protection or release settings.

SECURITY AND SCOPE
------------------
A self-hosted runner executes workflow code from the private repository to which it is registered. These runners are limited to the eleven named Brightdesk repositories. Do not attach them to public repositories or run untrusted fork code on them.

The GitHub CLI credential is used only by `gh api` to request a short-lived registration token for the specific repository. The temporary registration token is passed to the official `config.sh --token` option, as required by the runner configurator. It is not printed or saved to a file and is cleared from the setup script immediately after configuration. The temporary token is present in the configurator process arguments while that command runs.

The runners are owner-operated development infrastructure. They do not run as part of Brightdesk customer products and do not create a customer network dependency.

OFFICIAL REFERENCES
-------------------
GitHub self-hosted runner setup:
https://docs.github.com/en/actions/how-tos/manage-runners/self-hosted-runners/add-runners

GitHub runner v2.338.2 release and SHA-256 digests:
https://github.com/actions/runner/releases/tag/v2.338.2

Package version: 1.0
Runner version: 2.338.2
Architecture: macOS ARM64
Repository owner: conz20
