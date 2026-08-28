# Chrome Web Store listing

This is the store listing copy entered in the Chrome Web Store Developer
Dashboard. It is **not** part of the extension package — do not put it in
`manifest.json` (the manifest `description` is a separate short summary,
max ~132 characters).

Store page: https://chromewebstore.google.com/detail/tab-group-maestro/flbgfjckllcjpcnmanlfbaachmpgapom

---

## Description

Quickly search and find your native Chrome tab groups with fast autocomplete. No more wasting time trying to find that window, continue where you left off!

Features:
- Cmd+Shift+2: Launch extension. This can be changed in Chrome Extensions settings.
- Search your tab groups by name with fast autocomplete. Press enter to jump to the window of that tab group.
- Cmd+Shift+1: Switch to edit mode to add current tab to a new or existing tab group. Type group name and press enter. Press Cmd+Shift+1 again to switch back to search mode.

Note: This only works for open tab groups. Chrome doesn't expose closed tab groups to extensions.

See the blog post for how to use it:
https://medium.com/@semih.sezer/how-i-organize-my-chrome-tabs-in-2024-for-focus-and-productivity-d81802b0f14e

More about Chrome's native Tab Groups: https://blog.google/products/chrome/manage-tabs-with-google-chrome/

Release History:
1.2.1: 28th August 2026
- Fix blank popup on Chrome 151+ — the tab-group list no longer disappears on open

1.2.0: 14th August 2024
- Show tab groups in reverse accessed order, to keep the latest one at the top.
- Do not show current tab group in the dropdown
- Move focus to the selected tab group, instead of just focusing on the window
