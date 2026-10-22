# Buddy PWA — first version

A mobile-friendly, installable Progressive Web App starter for Buddy. It includes a chat-first interface, sliding navigation drawer, theme controls, local chat storage, projects, local data export/import, and optional memory controls.

## Important limitations

- This is a **local UI prototype**, not a connected AI assistant. Messages are saved locally and the app explains that AI is not connected.
- No API keys are included. Do not put a private AI API key in `app.js` or any frontend file. Add AI later through a backend that keeps secrets server-side.
- Data is stored in this browser on this device. Clearing site data can erase it. Use **Local library → Export backup** regularly.
- Cloud sync, login, secure account recovery, reliable background jobs, push notifications, and external integrations are not implemented yet.
- PWA installation and offline support require hosting on HTTPS (or localhost during development). Opening `index.html` directly as a file does not enable service workers/installability.

## Test on an Android phone

1. Extract `buddy-pwa.zip` into a folder in a coding workspace or repository.
2. Host the folder over HTTPS. A beginner-friendly option is GitHub Pages:
   - Create/sign into a GitHub account and create a new repository (for example `buddy-pwa`).
   - Upload all files and the `icons` folder to the repository root.
   - Open the repository **Settings → Pages**.
   - Under build/deployment, choose **Deploy from a branch**, select `main` and `/ (root)`, then save.
   - Wait for deployment and open the HTTPS URL shown in Pages.
   - If the page is served from a project subpath, the relative asset paths in this app should work.
3. On Android Chrome, open the HTTPS site, tap the three-dot menu, and choose **Install app** or **Add to Home screen** if offered.
4. Test creating chats and projects, changing themes, enabling/disabling memory, and exporting/importing a backup.

## Local development

If using a computer, serve this directory through a local web server (for example `python -m http.server 8000`) and open `http://localhost:8000`. A phone-only workflow can use a trusted online editor/repository hosting service; avoid uploading private data to public repositories.

## Files

- `index.html` — app layout and screens
- `styles.css` — responsive layout, light/dark themes and accents
- `app.js` — chat, project, settings and local storage behavior
- `manifest.webmanifest` — PWA metadata
- `sw.js` — service worker for caching/offline shell
- `icons/` — install icons

## Data safety

The memory feature is off by default. If enabled, its contents are saved locally in browser storage. Export a backup before importing another one or deleting data. This prototype does not send your chats to a server, but any later AI/cloud integration will need a clear privacy policy and secure backend.
