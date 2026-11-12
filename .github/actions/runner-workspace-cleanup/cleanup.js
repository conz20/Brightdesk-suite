'use strict';

const { removeRunnerWorkspace } = require('./cleanup-workspace');

try {
  if (process.env.GITHUB_ACTIONS !== 'true') {
    throw new Error('This cleanup action may only run inside a GitHub Actions job.');
  }
  const runnerWorkspace = process.env.RUNNER_WORKSPACE;
  if (runnerWorkspace) process.chdir(runnerWorkspace);
  const result = removeRunnerWorkspace({
    workspace: process.env.GITHUB_WORKSPACE,
    runnerWorkspace
  });
  console.log(result.removed
    ? 'Erased the complete checked-out source and build workspace after post-job actions.'
    : 'No checkout workspace remained to erase.');
} catch (error) {
  console.error(`Runner workspace cleanup failed: ${error.message}`);
  process.exitCode = 1;
}
