# Reviewed documentation PRs

`work` proposes one user-authored `README.md` or `docs/**/*.md` change in a repository you are authorized to edit.

```bash
gh-aura work preview --repo OWNER/REPO --path docs/setup.md \
  --file revision.md --save work.json
gh-aura work apply --review work.json
```

Preview shows the exact diff and records a bounded review. `apply` verifies the current branch/file and creates **only an unmerged PR**. Changed revisions or review records are rejected. Private work requires explicit `--private` at preview and a token with Contents/Pull requests write permissions.

GH Aura does not invent contributions, modify unrelated source files or guarantee a merge or achievement.
