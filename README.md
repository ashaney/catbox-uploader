# Catbox Uploader

A modern, minimalist file uploader for [catbox.moe](https://catbox.moe) with an elegant user interface.

![Catbox Uploader Screenshot](https://i.imgur.com/MuLIuFZ.jpeg)

## Features

- Clean, minimalist interface with glass morphism effects
- Drag and drop file upload area with elegant animations
- Upload progress visualization
- One-click copy for uploaded file links
- Upload history with thumbnails for images
- Fully responsive design for all devices

## Installation

```bash
bun install
```

## Development

```bash
bun run --watch index.ts
```

## Building for Production

```bash
bun run build
```

## Deployment

This project is configured for easy deployment on [Render](https://render.com).

### Deploying to Render

1. Fork or clone this repository to your GitHub account
2. Create a new Web Service on Render
3. Connect your GitHub repository
4. Render will automatically detect the `render.yaml` configuration
5. Click "Apply" to use the preset configuration
6. Your application will be deployed at a URL like `https://catbox-uploader.onrender.com`

Alternatively, you can use the Deploy to Render button:

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

### Manual Configuration

If you prefer to configure your deployment manually:

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Use the following settings:
   - Environment: Node
   - Build Command: 
     ```
     npm install -g bun
     bun install
     bun run build
     ```
   - Start Command: `bun index.ts`
   - Environment Variables:
     - `PORT`: `10000`

## API Information

This uploader uses the catbox.moe API located at https://catbox.moe/user/api.php

### Supported Operations

- File uploads (anonymous or with userhash)
- URL uploads
- File deletion
- Album management (create, edit, add/remove files, delete)

## License

MIT

---

This project was created using `bun init` in bun v1.2.4. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
