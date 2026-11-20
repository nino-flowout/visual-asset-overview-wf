# Visual Asset Overview

Local Next.js app for a Webflow export. It scans a folder on your machine, scores images, videos, and Lottie files, and stores the inventory as JSON under `data/projects/`.

Folder scan and local thumbnails run only in local development. The inventory model and `ProjectStore` are the pieces a later hosted version can replace.

## Scripts

```bash
npm run dev
npm test
npm run lint
```

Open the app, enter the absolute path of a Webflow code export, and scan. Assets are not uploaded.
