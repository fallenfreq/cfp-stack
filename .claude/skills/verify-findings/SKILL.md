---
name: verify-findings
description: Check each finding from a review (an agent's or a person's) before acting on it - show it happening, understand why the code is as it is, then fix it where it belongs or log it. Use whenever review findings come in.
---

For each finding:

1. **Show it happening.** Run what it's about: the code, a test, a query, a command, the page in
   the browser. A doc's claim about behaviour (a command, a flag, an answer) is run too; only a
   plain fact (a name, a path) is checked by finding it. Reading the code isn't enough to call
   a finding confirmed; if it can't be shown, say how far it was checked.
2. **Understand the code as it is.** Why was it written this way? Its comments, its doc and
   decisions, and its history (`git log -L`, `git blame`, the commit messages). If the behaviour
   is intended, wholly or partly, the finding questions a decision: raise it with the owner
   rather than change it.
3. **Place it.** Caused by this change (a regression) or from before it; inside the approved
   scope or outside it.
4. **Act.** Inside the scope: fix it in the layer that owns it, then show the fix working the
   same way the finding was shown. Outside: log it (the plan's Progress, or its doc's known
   issues) and raise it.
5. **Report** every finding: what it said, what checking showed, regression or older, and what
   was done, including those declined and why.
