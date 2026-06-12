# CI/CD Logs

The CS 144 spec requires "GitHub Actions logs demonstrating build, test, and deploy stages."

## Committed logs

- [`ci-run-11.log`](ci-run-11.log) — **CI** workflow (`ci.yml`), run #11. Shows lint, typecheck, **unit tests**, and **build** (frontend + backend).
- [`deploy-run-11.log`](deploy-run-11.log) — **Deploy** workflow (`deploy.yml`), run #11, `Build images & deploy to GKE` job. Shows building + pushing the backend and frontend images to Artifact Registry (**build**) and the `kubectl apply` + successful rollout to GKE (**deploy**), ending with 2/2 backend and 2/2 frontend pods `Running` plus the ingress external IP.

Together these cover the spec's build / test / deploy stages. (GitHub auto-masks repository secrets as `***`, so no project IDs, domains, or credentials are exposed in the committed logs.)

## How to refresh the logs

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
