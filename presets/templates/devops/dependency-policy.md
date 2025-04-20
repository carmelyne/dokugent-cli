# 📦 Dependency Management Policy

This document outlines how AI agents (and humans) should handle updates to package dependencies safely.

## 🧠 Pre-Update Protocol

Before updating dependencies via `npm install`, `npm update`, `pnpm upgrade`, or `yarn upgrade`, the agent must:

1. **Check for breaking changes**
   - Look up the changelogs for packages in `package.json`
   - Identify any major version bumps (e.g. from `^1.2.3` to `^2.0.0`)

2. **Evaluate Semver Risk**
   - Highlight any version drift due to loose constraints (`^`, `~`, `*`)
   - Flag risky updates for review

3. **Audit Package Health**
   - Check for deprecations, low maintenance signals, or untrusted packages via tools like [npms.io](https://npms.io/) or [bundlephobia](https://bundlephobia.com/)

## ✅ Post-Update Checklist

After applying updates:

- [ ] Run all tests in `/test/`
- [ ] Confirm no runtime errors on startup
- [ ] Run `docugent check-integrity` (TBD)
- [ ] Diff `package-lock.json` against the last committed version
- [ ] Log version diffs in `.docugent/changelog/vX.md`
- [ ] If the update fails, revert and log the failure in `dependency-log.md`

## 🔁 Fallback Protocol (If Update Fails)

If an updated dependency causes failures or instability:

1. **Revert Immediately**
   - Restore `package-lock.json` and `package.json` from version control
   - Reinstall using the last known good state (`npm ci`, `pnpm install`, etc.)

2. **Log the Incident**
   - Add a short note in `.docugent/devops/dependency-log.md` with:
     - Package name
     - Version attempted
     - What failed (tests, runtime, build)

3. **Flag for Human Review**
   - Leave a comment or commit note tagged with `#needs-human-audit`
   - Suggest possible next steps (e.g. lock version, explore migration path)

🧠 AI Note: Do not retry upgrades in a loop. Escalate when fallback is triggered.

## 📘 Optional Command Flow

```bash
# Dry-run future command
docugent lock-verify
```
