'use strict';

const fs = require('node:fs');
const path = require('node:path');

function isChildPath(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative !== '' && relative !== '..' &&
    !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

function removeRunnerWorkspace({ workspace, runnerWorkspace }) {
  if (typeof workspace !== 'string' || !workspace.trim() ||
      typeof runnerWorkspace !== 'string' || !runnerWorkspace.trim()) {
    throw new Error('Both workspace and runnerWorkspace paths are required.');
  }
  if (!path.isAbsolute(workspace) || !path.isAbsolute(runnerWorkspace)) {
    throw new Error('Runner workspace paths must be absolute.');
  }

  const requestedRoot = path.resolve(runnerWorkspace);
  const requestedWorkspace = path.resolve(workspace);
  if (!isChildPath(requestedRoot, requestedWorkspace)) {
    throw new Error('The checkout workspace must be a child of the runner work root.');
  }
  if (!fs.existsSync(requestedRoot)) {
    throw new Error('The runner work root does not exist.');
  }

  const realRoot = fs.realpathSync(requestedRoot);
  if (!fs.existsSync(requestedWorkspace)) {
    return { removed: false, workspace: requestedWorkspace };
  }

  const realWorkspace = fs.realpathSync(requestedWorkspace);
  if (!isChildPath(realRoot, realWorkspace)) {
    throw new Error('The resolved checkout workspace must remain inside the runner work root.');
  }

  fs.rmSync(realWorkspace, { recursive: true, force: false, maxRetries: 3, retryDelay: 250 });
  return { removed: true, workspace: requestedWorkspace };
}

if (require.main === module) {
  try {
    if (process.env.GITHUB_ACTIONS !== 'true') {
      throw new Error('This cleanup command may only run inside a GitHub Actions job.');
    }
    if (process.env.RUNNER_WORKSPACE) {
      process.chdir(process.env.RUNNER_WORKSPACE);
    }
    const result = removeRunnerWorkspace({
      workspace: process.env.GITHUB_WORKSPACE,
      runnerWorkspace: process.env.RUNNER_WORKSPACE
    });
    console.log(result.removed
      ? 'Erased the complete checked-out source and build workspace.'
      : 'No checkout workspace remained to erase.');
  } catch (error) {
    console.error(`Runner workspace cleanup failed: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = { removeRunnerWorkspace };
