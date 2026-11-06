# Shravan Search

A frontend-only job discovery website inspired by clean answer and search interfaces.

## Stack
- HTML, CSS and vanilla JavaScript
- Static JSON directory: jobs.json
- GitHub Pages or Cloudflare Pages hosting
- No backend, database, API key, login or server function

## Features
- Search across a curated directory of official employer career pages and established job platforms
- Location, field and experience filters
- Search suggestions and popular searches
- Responsive layout for mobile and desktop
- Dark/light theme preference saved in the browser
- External source links open safely in a new tab

## Run locally
Because the site loads jobs.json with fetch, run it through a local static server rather than opening index.html as a file. For example, use the VS Code Live Server extension or Python's built-in static server:

    python -m http.server 8000

Then visit http://localhost:8000.

## Update career sources
Edit jobs.json. Each entry is a career-source directory record, not a confirmed job vacancy. Keep the official source URL, description and tags accurate. Do not label a company or vacancy as verified unless it has actually been checked.

## Important limitation
This static version searches only the career sources stored in jobs.json. It does not crawl the whole internet, fetch live vacancies, accept applications, verify employers, or guarantee employment. Visitors must check current openings, eligibility, deadlines and application requirements on the original website.

## Deployment
- GitHub Pages: Settings → Pages → Deploy from a branch → main → / (root).
- Cloudflare Pages: Connect this repository, use the main branch, leave the build command empty, and set the output directory to /.

No build step is required.
