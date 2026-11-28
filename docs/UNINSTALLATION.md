# Uninstalling Brightdesk

Brightdesk uses the normal removal method for each operating system. Remove only the Brightdesk program you intend to remove. Removing a product must not remove the Suite or another separately installed Brightdesk product.

## Windows

1. Close the Brightdesk product.
2. Open **Settings**.
3. Select **Apps**, then **Installed apps**.
4. Find **Brightdesk Office Suite** or the individual Brightdesk product.
5. Select its menu and choose **Uninstall**.
6. Follow the uninstaller prompts.

The Windows NSIS configuration uses the assisted installer and explicitly disables app-data deletion. Normal uninstall removes the selected program and its installed shortcuts; it is not intended to remove that product's per-user settings, local language packs, dictionary data or documents saved elsewhere.

## macOS

1. Quit the Brightdesk product.
2. Open **Finder**, then **Applications**.
3. Move only the Brightdesk application you want to remove to the **Trash**.
4. Empty the Trash only when you are sure you no longer need the application.

Removing the application bundle does not require removing its separate per-user support data. Keep the Brightdesk folders in your user Library unless you have deliberately decided to remove that data as well.

## Linux

**Debian package (.deb):** use your Linux Software application or package manager to remove only the Brightdesk package you want to uninstall. Choose the normal **Remove** action, not **Purge**, when you want to retain local configuration and user data.

**AppImage:** close Brightdesk, then delete only the downloaded Brightdesk `.AppImage` file.

## Your documents and local data

Brightdesk documents saved to folders you choose are separate from the installed program and must be kept when the program is removed.

Application settings, the Terms acceptance record, local language packs and dictionary data are stored in the operating system's per-user application-data area. Keep that data when uninstalling. Do not manually remove those folders as part of an ordinary uninstall.

There is no automatic "remove all my data" option in this release. A future data-removal feature must be a separate, clearly labelled choice that names the affected data and requires explicit confirmation.

## Verification status

The installer configurations and source tests enforce the intended Windows data-retention setting and check that the application writes its settings and local resources to the per-user data directory. These source-level checks do not replace real platform testing.

Native install, upgrade, repair and uninstall acceptance must still be performed on Windows, macOS and Linux before Brightdesk can claim complete installer/uninstaller verification. A successful package build or checksum check alone is not uninstall acceptance.
