# CI/CD Logs

The CS 144 spec requires "GitHub Actions logs demonstrating build, test, and deploy stages."
Commit two successful run logs into this folder before the Jun 12 final-deadline submission:

- one **CI** run (`ci.yml`) — shows lint, typecheck, **test**, and **build** steps
- one **Deploy** run (`deploy.yml`) — shows the `Build & test` job and the `Build images & deploy to GKE` job (build/push images, get GKE credentials, deploy, rollout status)

Together these cover the spec's build / test / deploy stages.

## How to grab the logs

These commands run on your own machine and need the [GitHub CLI](https://cli.github.com/).
Run `gh auth login` once first.

```bash
# 1. List recent runs and copy the run IDs of a green (successful) run for each workflow
gh run list --workflow=ci.yml -L 5
gh run list --workflow=deploy.yml -L 5

# 2. Save the logs (replace <id> with the run IDs from step 1)
gh run view <ci-run-id>     --log > logs/ci-<ci-run-id>.log
gh run view <deploy-run-id> --log > logs/deploy-<deploy-run-id>.log

# 3. Commit them (.gitignore has a !logs/*.log exception so these are tracked)
git add logs/*.log
git commit -m "Add CI/CD run logs"
git push
```

### No GitHub CLI? Use the web UI

Actions tab -> open a green run -> the `...` menu (top right) -> **View raw logs** ->
save the file into this `logs/` folder with a `.log` extension, then commit as in step 3.
