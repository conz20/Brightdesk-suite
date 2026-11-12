# Local release verification

GitHub-hosted workflow runs are currently failing before their first runner step. This script provides a no-cost way to test and build Brightdesk on a computer you already own.

## Requirements

- macOS, Windows or Linux
- Exactly Node.js 24.22.2
- Internet access to install the project's public npm dependencies and run the npm security audit
- No GitHub payment method, paid subscription or signing certificate is required for an unsigned local build

## Run

From the Brightdesk repository folder, run:

```sh
npm run verify:local-release
```

The script checks the Node.js version and dependency lock, installs the locked dependencies, verifies licence notices, runs the full test suite, refreshes the static source inventory with `npm run rea:inspect`, runs release preflight and the high-severity npm audit, builds for the current operating system, prepares the legal/checksum assets and verifies the installer files.

The script builds only for the operating system where it is run:
- macOS: universal DMG, PKG and ZIP
- Windows: x64 EXE
- Linux: x64 AppImage and DEB

Build output is kept in the local `release/` folder. The script does not upload artifacts, create a GitHub Release or publish anything. Review the generated files and checksum report before sharing them. Local builds are unsigned unless signing credentials are already configured. Unsigned macOS apps may show a Gatekeeper warning, and unsigned Windows installers may show a SmartScreen warning. A successful unsigned build is not the same as a signed, notarised production release.

Run it separately on each operating system you intend to distribute Brightdesk for. A successful build on one platform does not verify the other platforms.

## No-cost GitHub Actions runners

The manual installer workflow uses private self-hosted runners instead of GitHub-hosted runners. This avoids consuming paid hosted-runner minutes and keeps source code on computers controlled by the project owner.

Register one runner for each required platform in the repository's **Settings → Actions → Runners** page:

- **macOS:** labels `self-hosted`, `macOS`, `ARM64` (the existing Apple-silicon Mac runner).
- **Windows:** labels `self-hosted`, `Windows`, `X64` (the project Windows PC).
- **Linux:** labels `self-hosted`, `Linux`, `X64` (a Linux x64 computer).

GitHub assigns the standard operating-system and architecture labels when each runner is registered. Do not add a custom label in place of the standard labels above. Keep the runner service active while a build is queued. The installer workflow waits for all three matching runners; if a platform runner is offline or not registered, that platform's job remains queued and the full bundle cannot be collected.

The existing Mac runner can handle the preparation, collection and macOS build jobs. A Windows runner is required for the native Windows installer, and a Linux x64 runner is required for the native Linux packages. Do not substitute a cross-build from another operating system and call it verified. The workflow does not publish a release unless the manual `publish_release` input is explicitly enabled; its default remains disabled.

Runner setup requires access to each physical computer and a one-time registration from the repository settings. Never copy a runner registration token into source files, logs, issues or documentation. Keep all runners private to this repository and do not run untrusted fork pull-request code on them.


### Mac foundation runner setup

The private Mac setup helper in [tools/runner-setup/macos](../tools/runner-setup/macos/README.txt) registers repository-scoped runners for the eight infrastructure repositories whose quality checks require a Mac runner: Brightdesk-Common-Actions, Brightdesk-Developer-Tools, Brightdesk-Extensions, Brightdesk-Wiki, Brightdesk-Release-Tools, Brightdesk-Services, Brightdesk-Assets and Brightdesk-Lists. Lists receives the additional `brightdesk-product-ci` label required by its quality workflow.

On the Apple-silicon Mac, first sign in to GitHub CLI as `conz20` with administrator access to those repositories:

```sh
gh auth login --hostname github.com
```

Then, from the Brightdesk-suite repository root, run:

```sh
bash tools/runner-setup/macos/Start-Brightdesk-Mac-Foundation-Runners.sh
```

The helper downloads the official GitHub Actions runner v2.338.2 macOS ARM64 archive, verifies its published SHA-256 digest, checks existing registrations before creating any, and starts configured runners with `nohup`. For each repository, GitHub CLI requests a short-lived registration token through the repository registration-token API. The GitHub CLI credential itself is not passed to the runner configurator. The short-lived token is passed to the official `config.sh --token` option, is not printed or saved, and is cleared immediately after configuration. It is briefly present in the configurator process arguments while that command runs. The helper reuses a complete, unconfigured runner folder left by an interrupted setup but never overwrites an unexpected or configured folder. It does not use launchd or require administrator elevation. It adds repository-scoped Actions runner registrations only; it does not change repository permissions, secrets, variables, workflows, visibility, branch protection or release settings.

Type `REGISTER` only after reviewing the eight-repository list shown by the script. Confirm the runners show as **Idle/Online** under Settings → Actions → Runners in each repository. The processes continue after closing the terminal, but do not auto-start after logout or reboot. Rerun the helper after signing in to restart an existing local runner if it is offline. If the helper reports a registration/folder mismatch, inspect it manually; do not delete a runner registration or local folder blindly.

### Windows runner setup

The click-to-run Windows x64 setup source and exact instructions are in [tools/runner-setup/windows](../tools/runner-setup/windows/README.txt). The supplied ZIP contains the CMD launcher, PowerShell installer and README. It downloads the official runner, checks the published SHA-256 digest, installs under `C:\actions-runner`, and registers the runner only to this private repository. It retains GitHub's default labels: `self-hosted`, `Windows` and `X64`.

1. Extract the supplied setup ZIP on the Windows PC.
2. Open [the repository's New self-hosted runner page](https://github.com/conz20/Brightdesk-suite/settings/actions/runners/new), select **Windows** and **x64**, and generate the one-time token.
3. Double-click `Start-Brightdesk-Windows-Runner.cmd`, approve the Windows administrator prompt, and enter the token only into the official runner configuration prompt on the Windows PC.
4. Confirm `Brightdesk-Windows-PC` appears as **Idle** in Settings → Actions → Runners.

The token expires after one hour. Never paste it into chat, an issue, source code or logs. Registration does not switch any workflow to this runner; update the Windows job to use `[self-hosted, Windows, X64]` only after the runner appears online. The setup source stops rather than overwriting a non-empty existing runner folder.


### Optional Linux x64 runner using Windows Subsystem for Linux

A separate Linux computer is not necessarily required for the first Linux build attempt. A Windows x64 computer with WSL 2 and a supported Ubuntu distribution can be evaluated as a no-cost Linux runner:

1. Confirm the Windows machine supports WSL 2. Microsoft's current install guidance supports Windows 11 and Windows 10 version 2004 (build 19041) or later. See [Install WSL](https://learn.microsoft.com/en-us/windows/wsl/install).
2. Install or open an Ubuntu distribution under WSL 2. Check it from PowerShell with `wsl --list --verbose`; the distribution must show version `2`.
3. In the Ubuntu environment, install and register a GitHub Actions Linux x64 self-hosted runner for this private repository. Use the repository's generated one-time registration token; never save it in the repository.
4. Run the Linux runner as an interactive WSL process using its `run.sh` launcher. Do **not** install it as a Windows service. Ubuntu's WSL guidance explains that current Store-based WSL requires a logged-in user session and cannot be started by a Windows service; see [Running WSL workflows](https://ubuntu.com/wsl/docs/stable/howto/run-workflows-azure/).
5. Confirm GitHub shows the runner as **Idle/Online** with the labels `self-hosted`, `Linux` and `X64`. Keep the Windows user session and WSL runner active while the manual installer workflow is running.

**Verification status:** this is an optional route to evaluate, not an already verified Brightdesk build environment. The runner must first complete the Linux Suite build, all ten product builds, artifact checks and checksum generation. WSL package creation does not by itself prove that the DEB or AppImage works in a native Linux desktop session; test installation, first launch, window behaviour and removal on a real Linux desktop before release acceptance. A WSL runner also stores a temporary Actions checkout in its runner workspace during the job; use the configured cleanup policy and do not treat that temporary checkout as the canonical repository.
