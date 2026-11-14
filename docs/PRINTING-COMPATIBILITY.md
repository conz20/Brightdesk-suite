# Brightdesk Printing Compatibility Matrix

**Status:** engineering reference for the current printing integration branch. This is a source-level audit, not proof of physical printer operation.

## Shared printing behaviour

All ten approved Brightdesk products expose the same **Print** and **Printer settings** actions. Each product uses the local Brightdesk Printing adapter and the operating system's visible print dialog. The user selects a printer and controls the operating-system print options. Brightdesk does not silently create a queue, pair a device, install a driver, upload document content, or claim that accepted jobs have physically printed.

The current renderer path calls `listPrinters()` before printing. If the operating system has no configured queue, Brightdesk asks the user to open **Printer settings** and add one through macOS, Windows, or Linux. This is intentional: discovering a network device is not the same as having a usable operating-system print queue.

**Implemented in this integration branch (not yet merged):** the product renderer includes a customer-facing **Find network printers** panel. Opening the panel does not start discovery; the user must choose **Search local network**. Results show safe display names and protocol labels. Eligible Windows WSD results offer a separate, explicit **Pair** action; other discoveries direct the user to the operating system's printer settings. After a successful pairing, Brightdesk refreshes the configured printer list. The configured-printer panel also offers **Show capabilities** for each installed queue, displaying normalized colour, duplex, paper-size, resolution and maximum-copy information; unknown values are shown as not reported. These are source-level implementation findings, not proof that a real network printer was discovered or paired.

This discovery panel is separate from a Brightdesk print-preview experience. The current **Print** action builds a temporary content-only print document and opens the visible operating-system print dialog. A dedicated interactive Brightdesk preview and full product-specific page/range controls are not yet implemented.

## Product-by-product cross-reference

Microsoft documentation is used only as a workflow reference. Brightdesk remains an original, local-first implementation and does not depend on Microsoft applications or services.

| Brightdesk product | Microsoft workflow reference | Current Brightdesk print output | Remaining parity work |
|---|---|---|---|
| **Pages** | Word: document print preview, page selection, and print settings. [Microsoft reference](https://support.microsoft.com/en-us/word/print-a-document-in-word) | Prints the current Pages editor content through the OS dialog. | Add a Brightdesk print preview and explicit page/range choices; verify headings, tables, images, page breaks, and long documents. |
| **Sheets** | Excel: print a selection, active sheet(s), or workbook; respect print areas and page layout. [Microsoft reference](https://support.microsoft.com/en-us/excel/get-started/print-a-worksheet-or-workbook) | Prints the currently displayed sheet view. | Add selected-cell/range and print-area controls, plus page scaling/orientation choices. Whole-workbook printing requires multi-sheet support before it can be offered. |
| **Decks** | PowerPoint: print slides, speaker-notes pages, outlines, and multi-slide handouts. [Microsoft reference](https://support.microsoft.com/en-au/powerpoint/training/print-your-powerpoint-slides-handouts-or-notes) | Builds one themed 16:9 landscape page per slide from its title and body text, using the current lavender, midnight, or paper theme. | **Major gap:** preserve original slide layout and imagery (the current model stores title/body text only); add current/all/range selection and notes/outline/handout layouts when the product data supports them. |
| **Notes** | OneNote: print an individual note page. [Microsoft reference](https://support.microsoft.com/en-us/onenote/onenote-help-and-learning/print-a-page-of-your-notes-in-onenote-for-windows) | Prints the current note content as wrapping text. | Verify long-note pagination and readability. Keep page-level printing as the baseline; do not imply whole-notebook printing. |
| **Database** | Access: use Print Preview and print a formatted report with page setup. [Microsoft reference](https://support.microsoft.com/en-au/access/preview-and-print-a-report) | Prints the current table view without the generated Delete column; wide cell values wrap to fit the page. | Add a report-focused print view and page setup; confirm table/query output, column widths, and long records. |
| **Forms** | Forms: print a blank form, a response summary, or an individual response. [Microsoft reference](https://support.microsoft.com/en-us/forms/print-a-form) | Questions and Preview print as a clean blank questionnaire with answer lines and choice boxes. When Responses is selected, the saved response list is printed instead. | Add explicit **Blank form**, **Response summary**, and **Individual response** print actions. The summary should include useful response counts and charts if those exist in Brightdesk's data model. |
| **Lists** | Microsoft Lists: export the current view to Excel or CSV for further formatting and printing. [Microsoft reference](https://support.microsoft.com/en-us/sharepoint/lists/data-and-lists/export-to-excel-from-sharepoint-or-lists) | Prints the current filtered list view without its generated Edit/Delete column; wide cell values wrap to fit the page. | Verify that active filters/sorts and visible columns are reflected accurately; consider local CSV export for large lists and spreadsheet-style print preparation. |
| **Planner** | Planner: export plan tasks to Excel for sorting, filtering, reporting, and printing. [Microsoft reference](https://support.microsoft.com/en-us/planner/export-a-plan-to-excel) | Prints the current plan grouped by bucket in a single flowing column; task cards are kept together while buckets can continue across pages. | Add an offline spreadsheet-friendly export and verify bucket/task pagination, dates, status, and priority with document assertions and virtual-queue tests; optional physical spot checks may add visual evidence. |
| **To Do** | Microsoft To Do: print a list, with optional task steps and notes. [Microsoft reference](https://support.microsoft.com/en-us/todo/printing-lists-in-microsoft-to-do) | Prints the currently displayed task view. | Add explicit include/exclude controls for task steps and notes; verify completed, planned, and filtered views print only the intended tasks. |
| **Workspace** | Microsoft Loop: print a page. [Microsoft reference](https://techcommunity.microsoft.com/blog/microsoft365insiderblog/do-more-with-loop-content-using-the-new-print--pdf-export-command/4226542) | Prints the current Workspace page content without block-editing controls or add-item forms; long text blocks wrap to page width. | Verify headings, tables, lists, and embedded blocks paginate correctly; keep page printing separate from any whole-workspace export. |

## Suite and standalone consistency

The table above describes the ten product windows in the Suite integration. The standalone product repositories are separate builds and must be checked independently; having the same printer adapter does not mean every standalone build has identical product screens.

One confirmed difference is **Forms**: the Suite's Forms window contains Questions, Preview and Responses panels, while the current standalone Brightdesk-Forms integration branch exposes the Questions panel only. Its current print target therefore cannot yet provide Microsoft's blank-form, response-summary and individual-response print modes. This is a product-feature gap, not a printer-driver or queue problem.

Likewise, Decks currently stores slide title and body text only. The printing path can print those values, but it cannot provide PowerPoint-style slide imagery, speaker-note pages or handouts until the Decks document model supports that content.

Before claiming parity, review the Suite and each standalone product branch separately, including the exact content available to that build.

## Acceptance requirements

A product is not considered print-ready merely because its Print button exists. Each of the ten products must pass the following checks:

1. **Correct content:** the printed output contains the intended document, sheet, slide(s), note, report, form, list, plan, task list, or workspace page—not the surrounding Brightdesk interface.
2. **No lost content:** long text, tables, columns, images, task notes, and page breaks are handled without silent truncation or hidden-content leakage.
3. **Visible printer selection:** the operating system's print dialog appears and allows the user to choose any configured printer and the options supported by that printer.
4. **Honest queue state:** no configured printer produces a clear message and a route to OS printer settings. A discovered device is never described as ready until it has a usable OS queue.
5. **Safe device setup:** discovery and any pairing are started by the user; no queue or driver is installed silently.
6. **Accurate result:** Brightdesk reports OS submission acceptance only. Physical completion may be claimed only when separately evidenced by an actual printer test; that optional check is not part of software acceptance.
7. **Platform evidence:** run automated adapter, OS-API contract, packaging, and native-helper build checks available for macOS, Windows, and Linux separately. Use virtual queues and controlled test doubles; physical printer access is not required for this acceptance gate.

## Hardware-free acceptance policy

No Brightdesk contributor, maintainer or product owner is required to own, borrow, locate, visit or obtain access to a physical printer. A person's household, family or contacts must not be asked to provide printer access as a condition of progress.

The normal engineering acceptance gate is hardware-free: deterministic virtual-printer tests, test doubles for OS queue and print callbacks, product print-document assertions, privacy and IPC tests, packaging checks, and native-helper compilation/contract tests on the matching operating-system runner. A virtual submission proves only that the adapter handled the simulated OS callback; it never proves that paper printed.

Physical-printer spot checks are optional extended compatibility evidence, not a prerequisite for passing automated acceptance, merging the source changes, or the normal software release gate. When no device is available, record **Not physically verified** and keep that limitation visible. Do not claim that a specific printer model, driver or hardware combination was validated, and do not claim universal hardware compatibility.

## Verification boundary

The current integration includes the shared adapter, product print actions, OS printer-settings hand-off, and virtual-printer tests. The Suite packaging script invokes the native discovery build on macOS and Windows; Linux discovery uses the host's CUPS `ippfind` utility. Native compilation and contract tests verify build/API integration, not discovery of every real device.

No physical printer acceptance test is recorded by this matrix. That status is an explicit evidence limitation, not a blocker for hardware-free acceptance. Windows native build/CI, Linux CUPS integration, and the macOS/Windows native helper builds remain required engineering verification. Do not describe untested printer models or physical printing as validated.

## Priority order

1. Complete exact-head verification of the existing network-discovery panel, Windows WSD pairing, capability display and privacy safeguards across their matching operating systems. Keep a discovered device separate from a configured, usable print queue.
2. Correct Decks to print real slide visuals and add the appropriate slide/notes/handout layouts when the product data model supports them.
3. Complete the remaining product-specific print workflows listed above, including Sheets print areas, Database reports, explicit Forms response modes, Pages page ranges, and the relevant product pagination checks.
4. Run the full app-by-app and OS-by-OS hardware-free acceptance matrix using virtual queues, OS test doubles, and matching-platform native build checks. Record optional physical-printer spot checks separately; do not hold routine source acceptance or release solely because no physical device is available.
