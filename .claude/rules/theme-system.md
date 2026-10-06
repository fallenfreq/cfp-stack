---
paths:
    - client/**
    - shared/**
    - api/src/domain/**
    - api/src/routes/themes/**
    - api/functions_src/styles/**
    - api/scripts/seed.mjs
    - api/test/nodeViewSelectors.test.mjs
---

The theme system's spec is `client/src/assets/sf-system.md`; its open work, and where to resume,
`client/src/assets/sf-system-todo.md`, "Current state (resume here)".

- Classes (and comments) state meaning; the theme decides the look.
- Theme, component and content authors work without knowing about each other
  (`client/src/assets/sf-system.md`, "Three actors").
- A layout fix gets a layout check, its case on `/editor?seed=tests` (`client/README.md`,
  "Checks").
- No compat code below the browser floor (`client/README.md`).
