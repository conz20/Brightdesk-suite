'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');

const APPROVED_GUIDE_CAPTURE_IDS = Object.freeze([
  'suite',
  'pages',
  'sheets',
  'decks',
  'notes',
  'database',
  'forms',
  'lists',
  'planner',
  'todo',
  'workspace'
]);

function requireText(value, label) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error('Brightdesk guide screenshot provenance requires ' + label + '.');
  }
  return value;
}

function requireCommit(value, label) {
  const commit = requireText(value, label);
  if (!/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/i.test(commit)) {
    throw new Error('Brightdesk guide screenshot provenance requires a valid ' + label + '.');
  }
  return commit;
}

function buildGuideScreenshotManifest({
  captures,
  repository,
  appVersion,
  workflowCommit,
  pullRequestHeadCommit,
  pullRequestBaseCommit,
  platform,
  architecture,
  runnerOS,
  runnerArchitecture,
  workflowName,
  workflowRunId,
  workflowRunUrl,
  capturedAt
} = {}) {
  if (!Array.isArray(captures) || captures.length !== APPROVED_GUIDE_CAPTURE_IDS.length) {
    throw new Error('Brightdesk guide screenshot manifest requires exactly the Suite and ten approved products.');
  }

  const seen = new Set();
  const screenshots = captures.map(capture => {
    const applicationId = capture?.applicationId;
    if (!APPROVED_GUIDE_CAPTURE_IDS.includes(applicationId) || seen.has(applicationId)) {
      throw new Error('Brightdesk guide screenshot manifest must contain each approved capture exactly once.');
    }
    if (!Number.isSafeInteger(capture.bytes) || capture.bytes <= 0) {
      throw new Error('Brightdesk guide screenshot manifest requires a positive file size for ' + applicationId + '.');
    }
    if (typeof capture.sha256 !== 'string' || !/^[a-f0-9]{64}$/i.test(capture.sha256)) {
      throw new Error('Brightdesk guide screenshot manifest requires a valid SHA-256 digest for ' + applicationId + '.');
    }
    seen.add(applicationId);
    return {
      applicationId,
      fileName: applicationId + '.png',
      bytes: capture.bytes,
      sha256: capture.sha256.toLowerCase()
    };
  });

  if (APPROVED_GUIDE_CAPTURE_IDS.some(applicationId => !seen.has(applicationId))) {
    throw new Error('Brightdesk guide screenshot manifest is missing an approved product capture.');
  }

  const resolvedRepository = requireText(repository, 'the repository identity');
  if (resolvedRepository !== 'conz20/Brightdesk-suite') {
    throw new Error('Brightdesk guide screenshot provenance must identify conz20/Brightdesk-suite.');
  }

  const resolvedWorkflowRunId = requireText(workflowRunId, 'the workflow run ID');
  if (!/^\d+$/.test(resolvedWorkflowRunId)) {
    throw new Error('Brightdesk guide screenshot provenance requires a numeric workflow run ID.');
  }

  const resolvedWorkflowRunUrl = requireText(workflowRunUrl, 'the workflow run URL');
  let parsedWorkflowRunUrl;
  try {
    parsedWorkflowRunUrl = new URL(resolvedWorkflowRunUrl);
  } catch {
    throw new Error('Brightdesk guide screenshot provenance requires a valid HTTPS workflow run URL.');
  }
  if (parsedWorkflowRunUrl.protocol !== 'https:' ||
      parsedWorkflowRunUrl.hostname !== 'github.com' ||
      parsedWorkflowRunUrl.pathname !== '/conz20/Brightdesk-suite/actions/runs/' + resolvedWorkflowRunId) {
    throw new Error('Brightdesk guide screenshot provenance requires a valid HTTPS workflow run URL.');
  }

  const timestamp = requireText(capturedAt, 'the capture timestamp');
  if (Number.isNaN(Date.parse(timestamp)) || new Date(timestamp).toISOString() !== timestamp) {
    throw new Error('Brightdesk guide screenshot provenance requires an ISO 8601 capture timestamp.');
  }

  return {
    schemaVersion: 1,
    captureMode: 'source-runtime',
    repository: resolvedRepository,
    appVersion: requireText(appVersion, 'the app version'),
    capturedAt: timestamp,
    source: {
      workflowCommit: requireCommit(workflowCommit, 'workflow commit'),
      pullRequestHeadCommit: requireCommit(pullRequestHeadCommit, 'pull-request head commit'),
      pullRequestBaseCommit: requireCommit(pullRequestBaseCommit, 'pull-request base commit')
    },
    runner: {
      platform: requireText(platform, 'the runtime platform'),
      architecture: requireText(architecture, 'the runtime architecture'),
      os: requireText(runnerOS, 'the runner operating system'),
      architectureLabel: requireText(runnerArchitecture, 'the runner architecture label')
    },
    workflow: {
      name: requireText(workflowName, 'the workflow name'),
      runId: resolvedWorkflowRunId,
      runUrl: resolvedWorkflowRunUrl
    },
    screenshots
  };
}

async function captureGuideScreenshot({
  window,
  applicationId,
  allowedApplicationIds,
  outputDirectory
} = {}) {
  const approved = applicationId === 'suite' ||
    (Array.isArray(allowedApplicationIds) && allowedApplicationIds.includes(applicationId));
  if (!approved || typeof applicationId !== 'string' || !/^[a-z][a-z0-9-]*$/.test(applicationId)) {
    throw new Error('Unsupported Brightdesk guide screenshot target.');
  }
  if (!window || typeof window.isDestroyed !== 'function' || window.isDestroyed() ||
      typeof window.webContents?.capturePage !== 'function') {
    throw new Error('A live Electron window is required for a Brightdesk guide screenshot.');
  }
  if (typeof outputDirectory !== 'string' || outputDirectory.trim().length === 0) {
    throw new Error('A Brightdesk guide screenshot output directory is required.');
  }

  const image = await window.webContents.capturePage(undefined, { stayHidden: true });
  const png = image?.toPNG?.();
  if (!Buffer.isBuffer(png) || png.length === 0) {
    throw new Error('Electron returned an empty screenshot.');
  }

  const destinationDirectory = path.resolve(outputDirectory);
  await fs.mkdir(destinationDirectory, { recursive: true });
  const filePath = path.join(destinationDirectory, applicationId + '.png');
  await fs.writeFile(filePath, png, { mode: 0o600 });
  const { size } = await fs.stat(filePath);
  if (size === 0) throw new Error('The Brightdesk guide screenshot was written as an empty file.');

  return {
    applicationId,
    filePath,
    bytes: size,
    sha256: crypto.createHash('sha256').update(png).digest('hex')
  };
}

module.exports = {
  captureGuideScreenshot,
  buildGuideScreenshotManifest
};
