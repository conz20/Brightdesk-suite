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
2. Use a **dedicated standard macOS user account for runners**. Do not use the normal day-to-day account. The runner account must not have your personal GitHub CLI login, SSH keys or other saved credentials.
3. Install GitHub CLI (`gh`) for that runner account, but **do not run `gh auth login`**.
4. Create a temporary fine-grained personal access token in GitHub Settings → Developer settings → Personal access tokens → Fine-grained tokens:
   - Resource owner: `conz20`
   - Repository access: select **exactly these ten** approved product repositories listed above
   - Repository permissions: `Administration: Read and write` only
   - Expiration: choose the shortest expiry GitHub offers in your token-creation screen; GitHub's available lifetime choices can vary
   - Add no other permissions
5. Keep the token private. The Finder app requests it through a hidden-answer dialog. It is supplied through `GH_TOKEN` and is not stored in the macOS keychain, a config file or the setup log. The script uses it only for registration API calls and clears it before starting any runner. Revoke the fine-grained token in GitHub Settings immediately after the setup attempt, whether it succeeds or fails.
6. Keep normal macOS security protections enabled. Never send your token, sign-in code or runner registration token to ChatGPT or anyone else.
7. A self-hosted runner executes workflow code from its matching private repository. These runners share the dedicated macOS account and are not isolated from one another. Keep them limited to trusted Brightdesk workflow code. Do not use them for public repositories or untrusted fork/third-party workflow code.

RUN THE SETUP
-------------
From a Brightdesk-suite checkout that contains this helper, use the terminal fallback below. Enter the temporary token without echoing or saving it, run the script, then clear the variable:

   read -r -s -p "Temporary GitHub token: " GH_TOKEN; echo
   export GH_TOKEN
   bash tools/runner-setup/macos/Start-Brightdesk-Mac-Product-Runners.sh
   unset GH_TOKEN

The script then asks you to type REGISTER. Press Enter to cancel without registering anything.

NO-TERMINAL OPTION — FINDER APP
-------------------------------
A Finder-launched macOS app is included at:

   tools/runner-setup/macos/Brightdesk-Product-Runner-Setup.app

To use it without opening Terminal:
1. In GitHub, open the Brightdesk-suite branch `chore/product-mac-runners-2026-11-14` and use Code → Download ZIP.
2. Extract the ZIP in Finder. Keep the app bundle beside `Start-Brightdesk-Mac-Product-Runners.sh`; the app calls that sibling script.
3. Double-click `Brightdesk-Product-Runner-Setup.app`.
4. The app checks that GitHub CLI is installed. It does not use a saved GitHub CLI login.
5. Review the dedicated-account warning, choose Continue or Cancel, then enter the temporary fine-grained token in the hidden-answer dialog.
6. The app passes the token to the setup process without printing it. The script checks that it belongs to `conz20`, registers each repository runner, clears the token, and only then starts/restarts runner processes.
7. The app runs the setup in the background and displays whether the script completed. It does not open Terminal.

The Finder app does not install GitHub CLI, create a token, or sign in to GitHub. Create the temporary fine-grained token yourself in GitHub and use only the dedicated runner account. Do not use your normal macOS login or its saved GitHub credentials. Setup logs are stored with owner-only permissions in:
`~/Library/Logs/Brightdesk/Product-Runner-Setup/`

This draft app bundle is not code-signed or notarised. Do not bypass a macOS security warning unless you have reviewed and approved the exact source in this private repository. The app must remain beside the shell script extracted from the same reviewed branch.

The script:
- Verifies Apple-silicon macOS and checks the temporary fine-grained token belongs to `conz20`.
- Downloads the official GitHub Actions runner v2.338.2 macOS ARM64 archive and checks it against the pinned SHA-256 digest used by the existing Brightdesk Mac runner setup.
- Checks registered online/offline runners and required labels before adding anything. It does not create a duplicate if a matching online or offline product runner already exists.
- Requests a short-lived registration token separately for each product repository using GitHub CLI. The fine-grained personal access token is not passed to the runner configurator; only the repository's short-lived runner registration token is.
- Configures each runner only for its matching private repository and adds the `brightdesk-product-ci` label.
- Starts configured runners with `nohup`. It does not install a launchd service, elevate privileges or change repository settings.
- Keeps each runner's files and logs under `~/.brightdesk-product-ci-runners/products/<repository>/` with owner-only directory permissions.
- Restarts only a matching registered offline runner whose labels and local configuration match. It refuses to execute or reuse an unregistered existing runner folder, and refuses symbolic links or unexpected paths; inspect and move an unregistered folder aside before retrying.

The helper registers repositories sequentially and queues all runner starts until registration is complete. It clears `GH_TOKEN` and the temporary administration token before starting any runner. Each runner receives its own owner-only GitHub CLI configuration folder, which must be empty before launch; the helper refuses to start a runner if that folder contains files. The temporary fine-grained token is not printed or written to the setup log/config. Each short-lived runner registration token is passed only to GitHub's official runner configurator and cleared immediately after configuration.

AFTER SETUP
-----------
Open Settings > Actions > Runners in each product repository. Confirm the corresponding runner is Idle/Online and has all four labels:
- self-hosted
- macOS
- ARM64
- brightdesk-product-ci

A runner process remains active after its terminal window closes. It does not automatically restart after logout or reboot. Rerun this helper after signing in to restart a registered runner when its local installation is intact.

If an existing compatible runner is offline but its local files are not in the product helper's folder, the helper deliberately stops short of creating another registration. Inspect the runner in GitHub Settings > Actions > Runners and restart it from its existing local runner folder instead.

If the temporary fine-grained token does not have the required repository administration access, the script stops. Resolve the access problem through the normal account owner process; do not weaken repository permissions, change visibility or enable paid runners as a workaround.

SHARED-HOST SECURITY BOUNDARY
-----------------------------
All ten runner processes started by this helper run as the same dedicated macOS user. Registering each runner to a separate GitHub repository limits which repository can send jobs to that runner, but it does not create an operating-system security boundary between the runners. Workflow code running under this account may be able to read or change other files that this macOS user can access, including files in the other product runner folders.

Use these runners only for trusted Brightdesk workflow code. Do not attach them to public repositories, accept untrusted fork workflows, or run third-party workflow code on this shared account. For stronger isolation, use separate macOS accounts or separate hosts for different repositories, or use appropriately isolated ephemeral runners, before running code that is not fully trusted.

IMPORTANT LIMITS
----------------
Registering a runner only makes the matching product-repository workflow eligible to start. It does not prove the workflow passes. Check the exact PR head, all required workflow results, native platform builds and the outstanding physical-printer acceptance separately. These runners do not replace Windows or Linux verification.

This helper registers runners only in the ten product repositories. It does not register or start the separate Brightdesk-suite repository runner. Workflows in Brightdesk-suite itself will remain queued until that repository has its own compatible self-hosted runner online.

OFFICIAL REFERENCES
-------------------
GitHub self-hosted runner setup:
https://docs.github.com/en/actions/how-tos/manage-runners/self-hosted-runners/add-runners

Fine-grained personal access tokens, expiry and security:
https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens

Create a registration token for a repository (requires repository Administration: write; returned registration token expires after one hour):
https://docs.github.com/en/rest/actions/self-hosted-runners#create-a-registration-token-for-a-repository

Pinned GitHub Actions runner release:
https://github.com/actions/runner/releases/tag/v2.338.2

Runner version: 2.338.2
Architecture: macOS ARM64
Repository owner: conz20
Customer product count: exactly ten
