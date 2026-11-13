# Local tools, explicit boundaries

Engineering composition demo using [GH Aura](https://github.com/ibbuilds/gh-aura) as the inspectable project. Personal contribution must be supplied and confirmed by the real account owner.

The CLI and MCP share profile intent, a change plan and execution handlers. README/assets publish together; sidebar updates are separate verified steps. Unknown remote outcomes stop for reconciliation.

```sh
gh-aura improve draft USER --spec profile.json --output draft.md
gh-aura improve check USER --spec profile.json --file draft.md --resources
gh-aura improve plan USER --spec profile.json --file draft.md --output plan.json
```

Read the [execution boundary](../src/profile-plan.mjs) and [adverse-path tests](../tests/profile-plan.test.mjs). Local locks coordinate one state directory; they do not serialize unrelated clients on other machines.
