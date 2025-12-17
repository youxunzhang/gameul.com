# YouxiStudio.online

## Previewing the site locally
The pages in this repository (including `index.html`) fetch JSON assets with `fetch()`. Opening the HTML file directly in a browser (`file://` protocol) blocks those requests, so you will only see loading errors.

Run a small static server from the project root instead:

```bash
cd youxistudio.online
python3 -m http.server 8000
```

Then browse to <http://localhost:8000/index.html> (or any other page) to see the Classic Game Wall and the rest of the content with data loading correctly.

> **Tip:** If port `8000` is occupied, replace it with any free port and update the URL accordingly.

## Remote asset hosting
The gallery artwork and JSON used by the Classic Game Wall reference the production CDN at `https://youxistudio.online/img-classic/`. When previewing locally, the browser still loads those images over the network, so ensure you have an internet connection during testing.
