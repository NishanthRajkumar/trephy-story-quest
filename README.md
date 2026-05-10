# Our Story Quest

A playful romantic mini web app with memory checkpoints, rewards, and a final surprise.

## Features

- Responsive layout for laptop and mobile
- Touch-friendly interactions
- Quiz checkpoints with earned/missed coupons
- One-click WhatsApp share button
- Open Graph meta tags for social link preview

## Project Structure

- `index.html` - app markup and meta tags
- `styles.css` - styling, responsive breakpoints, touch and motion preferences
- `script.js` - app flow, quiz logic, WhatsApp sharing, and video poster generation
- `Images/` - photos and video used across each stage and reward

## Run Locally

This is a static site. You can open `index.html` directly in a browser.

For a local server (recommended):

```powershell
# from the project folder
python -m http.server 5500
```

Then open `http://localhost:5500`.

> Do not open `index.html` directly via `file://`. The video poster generation uses canvas and is blocked by the browser on the `file://` protocol.

## Customize Before Sharing

The `og:url` and `og:image` in `index.html` are already set to:

- Site: `https://nishanthrajkumar.github.io/trephy-story-quest/`
- Preview image: `https://raw.githubusercontent.com/NishanthRajkumar/trephy-story-quest/main/Images/preview-img.png`

Make sure `Images/preview-img.png` is pushed to GitHub for the WhatsApp link preview to work.

## Deploy to GitHub Pages

The repo is already set up at `https://github.com/NishanthRajkumar/trephy-story-quest`.

To push changes:

```powershell
git add .
git commit -m "Your message"
git push
```

To enable Pages (one-time setup):

1. Go to **Settings → Pages** in the repo.
2. Under **Build and deployment**:
   - Source: **Deploy from a branch**
   - Branch: **main**
   - Folder: **/ (root)**
3. Save and wait ~1 minute.

Live site: `https://nishanthrajkumar.github.io/trephy-story-quest/`

## WhatsApp Sharing

The app includes a "Share on WhatsApp" button on the final screen.

You can also share manually with:

`https://wa.me/?text=Try%20our%20tiny%20adventure%20https%3A%2F%2Fnishanthrajkumar.github.io%2Ftrephy-story-quest%2F`

## Notes

- GitHub Pages for public static repositories is free.
- For best social preview results, make sure `og:image` points to an absolute HTTPS image URL.
