# Installing Brightdesk Office Suite

## Do I need Node.js?

**No. You do not need to download or install Node.js to use Brightdesk.**

The Brightdesk desktop installer includes the Electron application runtime it needs. Install Brightdesk using the installer for your computer, then open Brightdesk normally.

Node.js 24.22.2 is used by the Brightdesk development team and automated build systems to prepare and test the installers. It is not a separate customer installation requirement.

## Choose the installer for your computer

Use only the installer built for your operating system:

- **Windows:** Brightdesk Windows installer (.exe)
- **Mac:** Brightdesk macOS installer (.dmg or .pkg)
- **Linux:** Brightdesk AppImage or Debian package (.deb)

Download the installer from the official Brightdesk release page. Open it and follow the installation steps shown by your operating system.

## Terms and Conditions

The Brightdesk Terms and Conditions must be accepted before the product workspace can be used.

- **Windows:** the NSIS installer (.exe) presents the agreement before installation continues.
- **macOS:** the DMG and PKG present the agreement before installation continues. For a first-time Mac installation, use the DMG or PKG rather than the ZIP archive.
- **Linux:** AppImage has no separate installer agreement page. The packaged application therefore displays the same blocking agreement on first launch, before the workspace opens.

Choose **Accept** or **Agree** to continue. Choose **Decline** or **Disagree** to cancel. Declining, or closing the blocking first-launch agreement without accepting, prevents the product workspace from opening. The application records acceptance against the current Terms text; changed terms require a fresh acceptance.

The agreement step is designed to produce the same consent outcome on all three operating systems, but its presentation differs where the operating system's package format requires it.

## Removing Brightdesk

Use your operating system's normal removal route. Removing the Suite removes the Brightdesk program; it does not remove documents and project files you created.

- **Windows:** Open **Settings → Apps → Installed apps**, find **Brightdesk Office Suite**, and choose **Uninstall**. You can also use the Brightdesk Office Suite uninstall entry in the Start menu.
- **macOS:** Quit Brightdesk Office Suite. In Finder, open **Applications** and move **Brightdesk Office Suite** to the Trash. This removes the application bundle.
- **Linux DEB:** Use your desktop's software manager or package manager to remove **Brightdesk Office Suite**.
- **Linux AppImage:** Quit Brightdesk Office Suite, then delete the AppImage file.

Brightdesk keeps its settings and other application data in the current user's profile. Normal application removal must not silently delete that user data, documents or project files. Back up important files before removing software. Do not remove Brightdesk data folders as part of an ordinary uninstall.

**Important Suite distinction:** The **Add to Suite** and **Remove from Suite** controls in the product catalogue only change which of the ten included workspaces are available inside Brightdesk Office Suite. They do not install or uninstall separate operating-system programs. The individual product packages, when distributed separately, are removed through the matching operating system's normal removal route.

The removal instructions describe the configured package formats. Successful native uninstall and data-preservation behaviour must still be verified on Windows, macOS and Linux before release.

## Important

- Do not install Node.js just to run Brightdesk.
- Do not open Brightdesk by running a command in Terminal or Command Prompt.
- Install Brightdesk as a normal desktop application.
- Only use release files that have passed the Brightdesk release verification checks.

If an installer for your operating system is not listed on the official release page yet, that installer has not been published.
