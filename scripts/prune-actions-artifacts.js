#!/usr/bin/env node
'use strict';

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_MIN_AGE_MS = DAY_MS;
const DEFAULT_PAGE_SIZE = 100;
const PLATFORM_ARTIFACT_NAMES = new Set([
  'brightdesk-Linux',
  'brightdesk-Windows',
  'brightdesk-macOS'
]);
const VERSIONED_BUNDLE_NAME = /^Brightdesk-[0-9]+[.][0-9]+[.][0-9]+(?:-[0-9A-Za-z.-]+)?-Installers$/;

function isApprovedArtifactName(name) {
  return typeof name === 'string' &&
    (PLATFORM_ARTIFACT_NAMES.has(name) || VERSIONED_BUNDLE_NAME.test(name));
}

function isPrunableArtifact(artifact, {
  now = Date.now(),
  minAgeMs = DEFAULT_MIN_AGE_MS,
  currentRunId = null
} = {}) {
  if (!artifact || !isApprovedArtifactName(artifact.name)) return false;
  if (!Number.isFinite(now) || !Number.isFinite(minAgeMs) || minAgeMs < 0) return false;
  if (currentRunId !== null && artifact.workflow_run?.id !== undefined &&
      String(artifact.workflow_run.id) === String(currentRunId)) {
    return false;
  }

  const createdAt = Date.parse(artifact.created_at);
  if (!Number.isFinite(createdAt)) return false;
  return now - createdAt >= minAgeMs;
}

function validateRepository(repository) {
  if (typeof repository !== 'string') {
    throw new Error('GITHUB_REPOSITORY must be in owner/repository form.');
  }
  const segments = repository.split('/');
  if (segments.length !== 2 || segments.some(segment => !/^[A-Za-z0-9_.-]+$/.test(segment))) {
    throw new Error('GITHUB_REPOSITORY must be in owner/repository form.');
  }
  return segments.map(encodeURIComponent).join('/');
}

function validateApiUrl(apiUrl) {
  let parsed;
  try {
    parsed = new URL(apiUrl);
  } catch {
    throw new Error('GITHUB_API_URL must be a valid HTTPS URL.');
  }
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.search || parsed.hash) {
    throw new Error('GITHUB_API_URL must be an HTTPS API base URL without credentials, query or fragment.');
  }
  let value = parsed.toString();
  while (value.endsWith('/')) value = value.slice(0, -1);
  return value;
}

async function pruneActionsArtifacts({
  repository,
  token,
  apiUrl = 'https://api.github.com',
  fetchImpl = globalThis.fetch,
  now = Date.now(),
  minAgeMs = DEFAULT_MIN_AGE_MS,
  currentRunId = null,
  perPage = DEFAULT_PAGE_SIZE
} = {}) {
  const encodedRepository = validateRepository(repository);
  if (typeof token !== 'string' || token.trim() === '') {
    throw new Error('GITHUB_TOKEN is required to prune old Brightdesk installer artifacts.');
  }
  if (typeof fetchImpl !== 'function') throw new Error('A Fetch-compatible HTTP client is required.');
  if (!Number.isInteger(perPage) || perPage < 1 || perPage > DEFAULT_PAGE_SIZE) {
    throw new Error('perPage must be an integer between 1 and 100.');
  }
  if (!Number.isFinite(now) || !Number.isFinite(minAgeMs) || minAgeMs < 0) {
    throw new Error('Artifact cleanup time and age limits must be valid non-negative numbers.');
  }

  const baseUrl = validateApiUrl(apiUrl);
  const headers = {
    Accept: 'application/vnd.github+json',
    Authorization: 'Bearer ' + token,
    'X-GitHub-Api-Version': '2022-11-28'
  };
  const artifacts = [];
  let page = 1;

  async function request(url, method) {
    const response = await fetchImpl(url, { method, headers });
    if (!response || response.ok !== true) {
      const status = response?.status || 'unknown';
      const detail = response?.statusText ? ' ' + response.statusText : '';
      throw new Error('GitHub artifact API returned ' + status + detail + ' for ' + method + '.');
    }
    return response;
  }

  while (true) {
    const url = baseUrl + '/repos/' + encodedRepository +
      '/actions/artifacts?per_page=' + perPage + '&page=' + page;
    const response = await request(url, 'GET');
    let payload;
    try {
      payload = await response.json();
    } catch {
      throw new Error('GitHub artifact API returned an invalid JSON listing.');
    }
    if (!payload || !Array.isArray(payload.artifacts)) {
      throw new Error('GitHub artifact API response did not include an artifacts array.');
    }
    artifacts.push(...payload.artifacts);
    if (payload.artifacts.length < perPage) break;
    if (Number.isInteger(payload.total_count) && page * perPage >= payload.total_count) break;
    page += 1;
    if (page > 1000) throw new Error('GitHub artifact listing exceeded the safe 1000-page limit.');
  }

  const selected = artifacts
    .filter(artifact => isPrunableArtifact(artifact, { now, minAgeMs, currentRunId }))
    .filter(artifact => Number.isSafeInteger(artifact.id) && artifact.id > 0);

  const deletedArtifacts = [];
  for (const artifact of selected) {
    const url = baseUrl + '/repos/' + encodedRepository +
      '/actions/artifacts/' + encodeURIComponent(String(artifact.id));
    await request(url, 'DELETE');
    deletedArtifacts.push({ id: artifact.id, name: artifact.name });
  }

  return {
    scannedCount: artifacts.length,
    selectedCount: selected.length,
    deletedArtifacts
  };
}

async function main() {
  try {
    const result = await pruneActionsArtifacts({
      repository: process.env.GITHUB_REPOSITORY,
      token: process.env.GITHUB_TOKEN,
      apiUrl: process.env.GITHUB_API_URL || 'https://api.github.com',
      currentRunId: process.env.GITHUB_RUN_ID || null
    });
    console.log(
      'Scanned ' + result.scannedCount + ' Actions artifact(s); removed ' +
      result.deletedArtifacts.length + ' old Brightdesk installer artifact(s).'
    );
    for (const artifact of result.deletedArtifacts) {
      console.log('- Removed ' + artifact.name + ' (artifact ' + artifact.id + ').');
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

if (require.main === module) main();

module.exports = {
  DAY_MS,
  DEFAULT_MIN_AGE_MS,
  PLATFORM_ARTIFACT_NAMES,
  VERSIONED_BUNDLE_NAME,
  isApprovedArtifactName,
  isPrunableArtifact,
  pruneActionsArtifacts
};
