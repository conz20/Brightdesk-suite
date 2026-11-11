BRIGHTDESK PRIVATE MAC RUNNER SETUP
===================================

Purpose
-------
Register and start private GitHub Actions runners on an Apple-silicon Mac for the Brightdesk repositories whose Mac checks are waiting for their own repository-scoped runner.

The setup covers these eight repositories:
- Brightdesk-Common-Actions
- Brightdesk-Developer-Tools
- Brightdesk-Extensions
- Brightdesk-Wiki
- Brightdesk-Release-Tools
- Brightdesk-Services
- Brightdesk-Assets
- Brightdesk-Lists

Brightdesk-Lists receives the additional label "brightdesk-product-ci" because its quality workflow requires that label. All runners retain GitHub's normal self-hosted, macOS and ARM64 labels.

BEFORE YOU START
----------------
1. This package is for an Apple-silicon Mac only.
2. Install GitHub CLI (gh) from the official GitHub distribution and sign in as conz20:
   gh auth login --hostname github.com
3. The signed-in GitHub credential must have administrator access to all eight private repositories, including permission to register repository-level self-hosted runners.
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
- Uses GitHub CLI's credential through the official runner's RUNNER_CFG_PAT environment setting. The credential is not placed in a command-line argument, printed, or saved by this script.
- Registers each runner only to its matching private Brightdesk repository.
- Starts each configured runner with nohup in the background. No launchd service or administrator elevation is used.
- Refuses to overwrite an existing local runner directory and does not create a duplicate when a matching runner is already online.

AFTER SETUP
-----------
Open Settings > Actions > Runners in each repository and confirm the matching runner appears as Idle/Online.

Runner files and private logs are kept under:

   ~/.brightdesk-product-ci-runners/<repository>/

The processes continue after the terminal window closes. They do not auto-start after logout or reboot. Run the setup script again after signing in to restart an already-registered runner whose local installation is intact.

If the script says a runner is registered but its folder or labels need inspection, stop and inspect that repository's runner page and the indicated local folder. Do not delete existing runner folders or remove registrations blindly.

If GitHub CLI does not have sufficient repository administration access, the script stops. Resolve the account permission with GitHub before retrying. The script does not change repository permissions, workflow files, repository visibility, branch protection or release settings.

SECURITY AND SCOPE
------------------
A self-hosted runner executes workflow code from the private repository to which it is registered. These runners are limited to the eight named Brightdesk repositories. Do not attach them to public repositories or run untrusted fork code on them.

The runner's registration credentials are handled by the official GitHub runner configuration program. The script does not store registration tokens or PATs in a file or pass them as command-line arguments.

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
