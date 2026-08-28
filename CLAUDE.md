@rules/incyclist-mobile-ui-foundations-v0.3.md
@rules/react-native.md
@rules/storybook.md
@rules/native-code-changes.md

## SonarCloud

SonarCloud only reports findings after a push/PR, so it can't be the first line of defense - before
considering a change to this repo done, re-read your own diff once specifically against known
recurring findings, not just against functional correctness:

- Cognitive complexity: SonarCloud flags functions above ~15. This applies to a function you're
  *extending*, not just ones you write from scratch - adding even one more branch/case/ternary to an
  already-dense function (e.g. a gesture/event handler accumulating direction-specific logic) can
  push it over the threshold. When it does, extract the individual branches into small named
  helpers (e.g. separate `useCallback`s per logical concern) rather than leaving one large function
  to refactor later.
- Node builtin imports: always `require('node:fs')` / `import ... from 'node:path'` etc. - never the
  bare specifier (`'fs'`, `'path'`, `'child_process'`, `'os'`, ...). This applies to any plain Node.js
  script in the repo (e.g. `scripts/*.js`), not just app source - SonarCloud scans those files too.
