# CLAUDE.md

Working notes for this repo. The README covers user/contributor basics
(install, build, load unpacked, dev loop) — this file is the non-obvious
stuff and the gotchas.

## What this is

A small MV3 Chrome extension. One Vue 3 SFC (`src/App.vue`), `src/main.js`,
`src/assets/css/app.css`, a service worker (`public/background/service-worker.js`),
and `public/manifest.json`. Built with Vite (`npm run build`, output to
`dist/`, which is gitignored). UI uses PrimeVue's `AutoComplete` +
`fuzzy-search`.

## Build & test loop

- `npm run build` → regenerates `dist/`.
- `npm run watch` → rebuilds `dist/` on save (unminified).
- Load/reload: `chrome://extensions` → Developer mode → Load unpacked →
  pick `dist/` (or hit the reload icon on the card after a rebuild).
- The popup **cannot be driven by browser automation** — it closes on blur.
  Verify by reloading the unpacked extension and opening the popup by hand,
  or by opening `chrome-extension://<id>/index.html` in a normal tab (the
  same `App.vue` renders there and the `chrome.*` APIs work).
- `tsc`/typecheck: none configured; this is plain JS.

## Releasing to the Chrome Web Store

1. Bump `version` in `public/manifest.json`. It **must be strictly greater
   than the version currently live on the store** (the store compares
   against the highest ever uploaded). Check the live version in the
   Developer Dashboard — the repo has lagged it before.
2. `npm run build`.
3. Zip the **contents** of `dist/` (not the `dist/` folder itself) so
   `manifest.json` sits at the zip root:
   `cd dist && zip -r -X ../dist.zip . -x '.*'`
4. Upload `dist.zip` in the Developer Dashboard.
5. Add a matching entry to `store/listing.md` release history.

`store/listing.md` is the Web Store listing copy — **not** part of the
package, and not the same as the manifest `description` (that's a separate
~132-char summary).

## Load-bearing popup workarounds — do not remove without re-testing

Chrome 151+ broke the popup (issue #6): the `AutoComplete` suggestions
overlay opened then instantly vanished / the popup showed blank. The fix
lives in a few small, easily-"cleaned-up" spots. If you touch `app.css` or
`App.vue`'s `mounted()`, re-test the popup on current Chrome:

- `App.vue` `mounted()`: `this.$refs.autoCompleteElement.bindResizeListener
  = function () {}` — PrimeVue closes the overlay on every window `resize`,
  and Chrome popups emit a stream of them. This no-op stops that.
- `App.vue` template: `appendTo="self"` on `<AutoComplete>` — render the
  panel inline instead of teleporting it to `<body>`.
- `App.vue`: `this.items = [...this.allItems]` (not `this.items =
  this.allItems`) in `search`/`onClear`/`onEscapeKey` — assigning the same
  array reference leaves PrimeVue stuck with `searching = true` (permanent
  spinner, overlay never opens).
- `app.css`: `body` is pinned to a fixed size with `overflow: hidden`, and
  `.p-autocomplete-items-wrapper` has a fixed height. A Chrome popup
  auto-sizes to content; a resize while the overlay is open closes it.
  Don't restore `body { height: 50rem }` or `var('...')` (invalid) syntax.

## History note

Contributor PR #7 fixed issue #6 by **deleting `AutoComplete`** for a plain
inline list. That approach was intentionally reverted — `main` keeps
`AutoComplete` and fixes the overlay instead (so keyboard nav, theming, and
the existing behavior stay). `main` was force-pushed (2026-08-28) to drop
PR #7/#8; those PRs still show as "merged" on GitHub but their commits are
no longer in `main`. The dropdown ordering (most-recently-used first,
current group hidden) and "focus the group's tab" behavior come from the
pre-existing local work on top of which the popup fix was applied.
