'use strict';

const { removeRunnerWorkspace } = require('../.github/actions/runner-workspace-cleanup/cleanup-workspace');

if (require.main === module) {
  try {
    if (process.env.GITHUB_ACTIONS !== 'true') {
      throw new Error('This cleanup command may only run inside a GitHub Actions job.');
    }
    if (process.env.RUNNER_WORKSPACE) process.chdir(process.env.RUNNER_WORKSPACE);
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
