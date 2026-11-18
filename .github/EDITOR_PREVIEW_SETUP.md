# Editor Preview Setup Guide (forked PRs)

Automated Cloudflare Pages previews of the Vega Editor running a PR's local
Vega packages — including PRs from forks. Modeled on
[ddev/ddev.com#430](https://github.com/ddev/ddev.com/pull/430) (refined in
[#432](https://github.com/ddev/ddev.com/pull/432)).

## Overview

Two workflows implement a secret-safe two-stage process:

1. **Build stage** — `.github/workflows/editor-preview-build.yml`: triggers on
   `pull_request` (no access to repository secrets, so untrusted fork code is
   safe to execute). Checks out the fork's head SHA, installs dependencies, and
   runs `npm run build-editor-preview`, which clones `vega/editor`, npm-links
   every local Vega package into it, and builds the site to `editor/dist`.
   The artifact is uploaded for the deploy stage.

2. **Deploy stage** — `.github/workflows/editor-preview-deploy.yml`: triggers
   on `workflow_run` after the build succeeds. Has access to secrets but never
   checks out or executes any fork code. Downloads the artifact and deploys it
   to Cloudflare Pages as branch alias `pr-<N>`, then posts/updates a single
   PR comment with the preview URL.

Forked PRs are **label-gated**: a maintainer adds the `preview` label to build
and deploy a preview. Same-repo branch PRs continue to get previews from the
Cloudflare Pages git integration.

## Preview URL

Previews deploy to the existing Pages project as branch aliases, giving each
PR a stable URL that updates on every push:

```
https://pr-<PR-number>.<CF_PAGES_PROJECT>.pages.dev
```

## Required repository configuration

Settings → Secrets and variables → Actions:

| Type     | Name              | Value                                                              |
| -------- | ----------------- | ------------------------------------------------------------------ |
| Secret   | `CF_API_TOKEN`    | Cloudflare API token with **Cloudflare Pages — Edit** permission   |
| Variable | `CF_ACCOUNT_ID`   | Cloudflare account ID                                              |
| Variable | `CF_PAGES_PROJECT`| Name of the existing Cloudflare Pages project (Direct Upload mode) |

The Pages project must use **Direct Upload** mode (not git-connected builds
for these alias deployments; the git integration can remain connected for
branch previews of same-repo branches).

## Workflow triggers

- Build: `pull_request` events `labeled` (with `preview`), `synchronize`,
  `reopened` — forked PRs only.
- Deploy: `workflow_run` completion of the build workflow, plus
  `pull_request_target: closed` to post a note that the preview is no longer
  updated.

## Security features

- **Two-stage architecture**: the build stage runs fork code with zero
  repository secrets; the deploy stage touches secrets but never fork code.
- **Explicit fork checkout**: the build checks out
  `<fork>@<head-sha>` with `persist-credentials: false`.
- **Label gating**: no Cloudflare build quota is spent on forked PRs unless a
  maintainer opts in with the `preview` label.

## Troubleshooting

- **Deploy fails with missing variable**: verify `CF_ACCOUNT_ID`,
  `CF_PAGES_PROJECT` (variables) and `CF_API_TOKEN` (secret) are set on the
  repository.
- **403 from Cloudflare API**: the API token lacks Pages edit permission or is
  scoped to the wrong account.
- **Build workflow didn't run**: confirm the PR is from a fork and has the
  `preview` label; `pull_request: labeled` only fires when a maintainer with
  triage rights adds the label.
- **Preview build exceeds 25 MB**: the editor build passes `--base /`; if the
  bundle grows, disable sourcemaps or adjust minification per
  [Vite CLI options](https://vite.dev/guide/cli.html#options-1).
