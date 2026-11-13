# Local release verification

Use this guide to run and verify Brightdesk's builds on computers you already own. Each operating system requires its own native build and acceptance checks.

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
- **Windows:** labels `self-hosted`, `Windows`, `X64` (a 64-bit Windows 10 or Windows 11 PC; GitHub lists both as supported self-hosted runner operating systems).
- **Linux:** labels `self-hosted`, `Linux`, `X64` (a Linux x64 computer).

GitHub assigns the standard operating-system and architecture labels when each runner is registered. Do not add a custom label in place of the standard labels above. Keep the runner service active while a build is queued. The installer workflow waits for all three matching runners; if a platform runner is offline or not registered, that platform's job remains queued and the full bundle cannot be collected.

The existing Mac runner can handle the preparation, collection and macOS build jobs. A Windows runner is required for the native Windows installer, and a Linux x64 runner is required for the native Linux packages. Do not substitute a cross-build from another operating system and call it verified. The workflow does not publish a release unless the manual `publish_release` input is explicitly enabled; its default remains disabled.

Runner setup requires access to each physical computer and a one-time registration from the repository settings. Never copy a runner registration token into source files, logs, issues or documentation. Keep all runners private to this repository and do not run untrusted fork pull-request code on them.


### Mac foundation runner setup

The private Mac setup helper in [tools/runner-setup/macos](../tools/runner-setup/macos/README.txt) registers repository-scoped runners for seven infrastructure repositories, four product repositories and the shared Printing repository: Brightdesk-Common-Actions, Brightdesk-Developer-Tools, Brightdesk-Extensions, Brightdesk-Wiki, Brightdesk-Release-Tools, Brightdesk-Services, Brightdesk-Assets, Brightdesk-Printing, Brightdesk-Lists, Brightdesk-Pages, Brightdesk-Database and Brightdesk-Decks. Lists, Pages, Database and Decks receive the additional `brightdesk-product-ci` label. Printing receives its separate `brightdesk-printing-ci` label.

On the Apple-silicon Mac, first sign in to GitHub CLI as `conz20` with administrator access to those twelve repositories:

```sh
gh auth login --hostname github.com
```

In Finder, double-click [Start-Brightdesk-Mac-Foundation-Runners.command](../tools/runner-setup/macos/Start-Brightdesk-Mac-Foundation-Runners.command). macOS opens Terminal and starts the checked-in setup script from the repository checkout. You do not need to type a shell command or navigate to the repository folder.

The helper downloads the official GitHub Actions runner v2.338.2 macOS ARM64 archive, verifies its published SHA-256 digest, checks existing registrations before creating any, and starts configured runners with `nohup`. For each repository, GitHub CLI requests a short-lived registration token through the repository registration-token API. The GitHub CLI credential itself is not passed to the runner configurator. The short-lived token is passed to the official `config.sh --token` option, is not printed or saved, and is cleared immediately after configuration. It is briefly present in the configurator process arguments while that command runs. The helper reuses a complete, unconfigured runner folder left by an interrupted setup but never overwrites an unexpected or configured folder. It does not use launchd or require administrator elevation. It adds repository-scoped Actions runner registrations only; it does not change repository permissions, secrets, variables, workflows, visibility, branch protection or release settings.

Type `REGISTER` only after reviewing the twelve-repository list shown by the script. Confirm the runners show as **Idle/Online** under Settings → Actions → Runners in each repository. The processes continue after closing the terminal, but do not auto-start after logout or reboot. Rerun the helper after signing in to restart an existing local runner if it is offline. If the helper reports a registration/folder mismatch, inspect it manually; do not delete a runner registration or local folder blindly.

### Windows runner setup

The click-to-run Windows x64 setup supports 64-bit Windows 10 and Windows 11 and uses two files kept together: [Start-Brightdesk-Windows-Runner.cmd](../tools/runner-setup/windows/Start-Brightdesk-Windows-Runner.cmd) and [Install-Brightdesk-Windows-Runner.ps1](../tools/runner-setup/windows/Install-Brightdesk-Windows-Runner.ps1). Download both files from this private repository to the same folder. The CMD launcher starts the checked-in PowerShell installer beside it; it does not attempt an unauthenticated download from the private repository. There is no setup ZIP.

The installer uses Windows Package Manager (winget) to install Git for Windows and GitHub CLI only when either is missing. It adds the Git and Bash directories to the machine PATH for the runner service, then uses GitHub CLI's official browser/device sign-in flow. Sign in as `conz20`, which must have administrator access to the private Brightdesk-suite repository. The installer requests the short-lived repository runner registration token automatically through GitHub CLI and passes it to the official runner configurator; you do not open the runner registration page or copy/paste the token.

1. Download both the Windows launcher and its PowerShell installer from the private repository to the same folder.
2. Double-click `Start-Brightdesk-Windows-Runner.cmd` and approve the Windows administrator prompt.
3. Read the security notice and type `REGISTER`.
4. Allow the installer to add Git for Windows and GitHub CLI if they are missing. If it reports that winget is unavailable, install or update **App Installer** from the Microsoft Store and run the same launcher again.
5. When GitHub CLI asks, complete the official browser/device sign-in as `conz20`.
6. Confirm `Brightdesk-Windows-PC` appears as **Idle/Online** in Settings → Actions → Runners.

The GitHub CLI credential remains on the Windows PC. The short-lived runner registration token is retrieved automatically, is not printed or saved to a file, and is cleared from the script after configuration. Never share GitHub sign-in codes or credentials. Keep the runner restricted to the private repository. The release workflow already targets `[self-hosted, Windows, X64]`; once this runner appears Idle/Online, it is eligible for the native Windows build.

### Linux x64 runner using Windows Subsystem for Linux 2

A Windows 10 or Windows 11 x64 computer can provide the Linux x64 build runner through Ubuntu on WSL 2. This is a separate Linux runner from the native Windows runner and uses GitHub's standard `self-hosted`, `Linux` and `X64` labels.

The supported WSL route is Windows 11 or **64-bit Windows 10 version 2004 (build 19041) or later**, with WSL 2 and Ubuntu 22.04 LTS or Ubuntu 24.04 LTS. It does not replace the native Windows runner or native Linux desktop acceptance.

The repository includes a setup script and full instructions:

- [Linux runner setup instructions](../tools/runner-setup/linux/README.txt)
- [Linux runner setup script](../tools/runner-setup/linux/Install-Brightdesk-Linux-Runner.sh)

Follow the instructions in the Ubuntu terminal:

1. From Windows PowerShell, install Ubuntu 24.04 with `wsl --install -d Ubuntu-24.04`, then complete Ubuntu's first-run setup.
2. Confirm the distribution uses WSL 2 with `wsl --list --verbose`. If it shows version 1, convert it using `wsl --set-version Ubuntu-24.04 2`.
3. In Ubuntu, install prerequisites with `sudo apt update` and `sudo apt install -y ca-certificates curl git gh jq tar findutils procps`.
4. Sign in to GitHub CLI as `conz20` with repository administration access: `gh auth login --hostname github.com`.
5. From the Brightdesk-suite checkout in Ubuntu, run `bash tools/runner-setup/linux/Install-Brightdesk-Linux-Runner.sh`.
6. Review the repository and security notice, type `REGISTER`, then confirm the runner is **Idle/Online** in Settings → Actions → Runners with labels `self-hosted`, `Linux` and `X64`.

The script downloads the official GitHub Actions Linux x64 runner v2.338.2, verifies its published SHA-256 digest, checks for existing compatible registrations, requests a short-lived registration token through GitHub CLI and registers only to the private Brightdesk-suite repository. It does not install a Windows service or enable WSL auto-start. Keep Ubuntu and the Windows user session running while a Linux build is queued; after WSL shuts down, reopen Ubuntu and rerun the setup script to restart the existing runner.

The runner application and its local log remain in the WSL distribution under `~/.brightdesk-product-ci-runners/Brightdesk-suite`. The job checkout is temporary and is removed by the post-job cleanup action described below. WSL build success does not prove native Linux desktop behaviour: DEB/AppImage installation, launch, window behaviour and removal must also be checked on a real supported Linux desktop before release acceptance.

### Automatic post-job checkout erasure

All eight self-hosted workflows register the pinned Brightdesk workspace-cleanup action as their first step. The action's post-job hook runs after GitHub has completed the checkout and other actions' own post-job cleanup, including checkout and setup-node. It runs with `post-if: always()`, so it also cleans up after failed or cancelled workflow steps when the runner can still execute post-job actions.

The action verifies that the checked-out workspace is an ordinary directory beneath `RUNNER_WORKSPACE`, rejects symbolic-link paths and refuses to erase the runner work root or any path outside it. It removes the job checkout, including `.git`, source files, dependencies and generated build output. The action deliberately runs after GitHub's own post-job steps; it must not be moved back to an ordinary final shell step, because that can break GitHub's later checkout cleanup.

The cleanup removes the job checkout, not the installed runner application, its logs, the user's home directory, Windows files or the WSL distribution. The runner remains available for later jobs. Source exists on the runner disk while a job is running and is removed after the job's post-job actions finish; this is not a claim that source is never written locally.

