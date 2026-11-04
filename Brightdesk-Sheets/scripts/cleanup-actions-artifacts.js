#!/usr/bin/env node
'use strict';

const PREFIXES = ['Brightdesk-', 'brightdesk-'];

function isBrightdeskArtifact(artifact) {
  return Boolean(
    artifact &&
    typeof artifact.name === 'string' &&
    PREFIXES.some(prefix => artifact.name.startsWith(prefix)) &&
    artifact.expired !== true &&
    Number.isFinite(Number(artifact.id))
  );
}

function selectBrightdeskArtifacts(artifacts) {
  return (Array.isArray(artifacts) ? artifacts : []).filter(isBrightdeskArtifact);
}

async function cleanupArtifacts({ repository, token, apiUrl = 'https://api.github.com', fetchImpl = globalThis.fetch, log = () => {} } = {}) {
  if (!repository || !token) throw new Error('GITHUB_REPOSITORY and GITHUB_TOKEN are required to clean previous build artifacts.');
  if (typeof fetchImpl !== 'function') throw new Error('A Fetch API implementation is required.');
  const baseUrl = apiUrl.replace(/\/$/, '');
  const headers = {
    Authorization: 'Bearer ' + token,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28'
  };
  const artifacts = [];
  for (let page = 1; ; page += 1) {
    const response = await fetchImpl(baseUrl + '/repos/' + repository + '/actions/artifacts?per_page=100&page=' + page, { headers });
    if (!response.ok) throw new Error('Could not list Actions artifacts (' + response.status + ').');
    const payload = await response.json();
    const batch = Array.isArray(payload.artifacts) ? payload.artifacts : [];
    artifacts.push(...batch);
    if (batch.length < 100) break;
  }

  const candidates = selectBrightdeskArtifacts(artifacts);
  let deleted = 0;
  for (const artifact of candidates) {
    const response = await fetchImpl(baseUrl + '/repos/' + repository + '/actions/artifacts/' + artifact.id, { method: 'DELETE', headers });
    if (!response.ok && response.status !== 404) {
      throw new Error('Could not delete Brightdesk artifact ' + artifact.name + ' (' + response.status + ').');
    }
    deleted += 1;
    log('Removed previous temporary artifact: ' + artifact.name);
  }
  log('Brightdesk artifact cleanup: ' + deleted + ' removed; ' + artifacts.length + ' checked. GitHub Release assets are not affected.');
  return { listed: artifacts.length, deleted };
}

if (require.main === module) {
  cleanupArtifacts({
    repository: process.env.GITHUB_REPOSITORY,
    token: process.env.GITHUB_TOKEN || process.env.GH_TOKEN,
    apiUrl: process.env.GITHUB_API_URL || 'https://api.github.com',
    log: message => console.log(message)
  }).catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = { isBrightdeskArtifact, selectBrightdeskArtifacts, cleanupArtifacts };
