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
- `script.js` - app flow, quiz logic, and WhatsApp sharing

## Run Locally

This is a static site. You can open `index.html` directly in a browser.

For a local server (recommended):

```powershell
# from the project folder
python -m http.server 5500
```

Then open `http://localhost:5500`.

## Customize Before Sharing

Update these meta tag placeholders in `index.html`:

- `og:url`
- `og:image`

Use your final GitHub Pages URL and a public image URL.

## Deploy to GitHub Pages

1. Create a new GitHub repository (example: `our-story-quest`).
2. Push this project:

```powershell
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

3. On GitHub, go to **Settings -> Pages**.
4. Under **Build and deployment**:
   - Source: **Deploy from a branch**
   - Branch: **main**
   - Folder: **/ (root)**
5. Save and wait for deployment.

Your site URL will be:

`https://<your-username>.github.io/<your-repo>/`

## WhatsApp Sharing

The app includes a "Share on WhatsApp" button on the final screen.

You can also share manually with:

`https://wa.me/?text=Try%20our%20tiny%20adventure%20https%3A%2F%2F<your-username>.github.io%2F<your-repo>%2F`

## Notes

- GitHub Pages for public static repositories is free.
- For best social preview results, make sure `og:image` points to an absolute HTTPS image URL.
