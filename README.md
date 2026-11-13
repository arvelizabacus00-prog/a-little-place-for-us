# A Little Place for Us ♡

A cozy three-page scrapbook-style love story for two people who are choosing each other from afar.

## Open it

Serve this folder from a local web server or upload the three site files to any static host. For a quick local preview:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Make it yours

- **Welcome page:** edit the title, subtitle, note, or cat/envelope labels directly in `index.html`.
- **Memory gallery:** click any empty photo card to upload a picture. Click an uploaded picture to open it larger. Edit any caption directly on the page; photos and captions save in this browser with `localStorage`.
- **Love letter:** click inside the letter or the P.S. line and type your own words. The edits save automatically in this browser.
- **One Last Thing:** edit the revealed message directly in `index.html` if you want a different final line.
- **Background music:** open the `•••` menu in the top-right music dock, paste a YouTube link, and choose **Use it**. The play/pause and mute/unmute controls stay mounted while the three pages change, so navigation does not restart the player.

The site is intentionally dependency-light: `index.html`, `styles.css`, and `script.js` are the complete website.
