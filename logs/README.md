# CI/CD Logs

The CS 144 spec requires "GitHub Actions logs demonstrating build, test, and deploy stages." Drop two successful GitHub Actions run logs in this folder before the Jun 12 final-deadline submission.

## How to grab a run log

```bash
# List recent runs:
gh run list --workflow=deploy.yml -L 5

# Download the logs of a specific run (replace <run-id>):
gh run view <run-id> --log > logs/deploy-<run-id>.log

# Or, in the GitHub UI: Actions → click the run → "..." menu → "View raw logs".
```

Commit two such logs (one for `ci.yml`, one for `deploy.yml`) here. They should clearly show distinct **build**, **test**, and **deploy** stages.
