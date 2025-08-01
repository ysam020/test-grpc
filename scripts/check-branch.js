const { execSync } = require('child_process');

// Check if the bypass flag is present
if (process.env.SKIP_BRANCH_LINT === 'true') {
    console.log('[Branch Lint] Skipped due to SKIP_BRANCH_LINT flag.');
    return;
}

// Retrieve the current branch name
const branchName = execSync('git symbolic-ref --short HEAD').toString().trim();

// Define the regex pattern
const branchRegex =
    /^(feat|fix|hotfix|chore|ci|build|docs|refactor|perf|test)\/[\w-]+$/;

console.log(`Branch name: ${branchName}`);

// Check if the branch name matches the regex
if (!branchRegex.test(branchName)) {
    console.error(
        `\nERROR: Invalid branch name "${branchName}".\nBranch names must follow the pattern: feat/xxx, fix/xxx, hotfix/xxx, chore/xxx, ci/xxx, build/xxx, docs/xxx, refactor/xxx, perf/xxx, or test/xxx.\n`,
    );
    process.exit(1);
} else {
    console.log('Branch name is valid.');
}
