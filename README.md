# Tab Group Maestro

A Chrome Extension to quickly search and find your native Chrome tab groups.

<b>Features</b>:

- (Ctrl + Shift + 2) Launch the extension to search and find native Chrome Tab Groups with autocomplete
- (Ctrl + Shift + 1) Add current tab to tab group. Type tab group name to choose existing or create new tab group

[Download Extension from Chrome Web Store](https://chromewebstore.google.com/detail/tab-group-maestro/flbgfjckllcjpcnmanlfbaachmpgapom)

## Getting Started

### Initial Setup

This project uses `Vue3` with `PrimeVue` component library and `Vite`.

1. `npm install`

2. `npm run build`

3. Go to [chrome://extensions](chrome://extensions), enable developer mode, and add the extension by clicking load unpacked. Choose `./dist` folder for the directory of the extension.

4. Click the extension to make sure it is running.

### Development

1. Run the code with `npm run watch` for hot reload/refresh.
- Every time you make a change and save, the changes will be reflected as soon as you relaunch the chrome extension. No need to explicitly reload the extension.
- See `package.json` for more details on how this is configured.
