# MrRise Browser

A lightweight web browser interface built with plain HTML, CSS, and JavaScript.

## Features

- URL/search bar (supports direct URLs and search queries)
- Back, forward, reload, and home navigation
- Persistent bookmarks using localStorage
- Bookmark panel with remove/clear actions
- Status bar with loading and error messages

## Run locally

Because modern browsers can limit iframe behavior for `file://` pages, run a local server:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080` in your browser.

## Notes

Some websites block loading inside iframes through security headers (`X-Frame-Options` / CSP). Those sites may not render in this demo browser.
