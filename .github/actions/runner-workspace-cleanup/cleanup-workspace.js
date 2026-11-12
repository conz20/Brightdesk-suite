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

  if (fs.lstatSync(requestedWorkspace).isSymbolicLink()) {
    throw new Error('The checkout workspace must not be a symbolic link.');
  }
  const realWorkspace = fs.realpathSync(requestedWorkspace);
  if (!isChildPath(realRoot, realWorkspace)) {
    throw new Error('The resolved checkout workspace must remain inside the runner work root.');
  }

  fs.rmSync(requestedWorkspace, { recursive: true, force: false, maxRetries: 3, retryDelay: 250 });
  return { removed: true, workspace: requestedWorkspace };
}

module.exports = { removeRunnerWorkspace };
